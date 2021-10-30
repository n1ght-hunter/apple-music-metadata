import {Document} from 'domhandler';
import axios from 'axios';
import {DomUtils, parseDocument} from 'htmlparser2';
import axiosRetry from "axios-retry";

// apple will somtimes reject request due to overload this will retry each request up to 5 times
axiosRetry(axios, {retries: 5});

interface RawApplePlaylist {
    name: string
    type: 'playlist'|'album'
    author: string
    tracks: { artist: string, title: string }[]
};
interface RawAppleSong {
    type?: 'song'
    artist: string, 
    title: string
};

/**
 * @param {Document} document
 * @param {boolean} album
 * @returns {Promise<?RawApplePlaylist>}
 */
async function findJSONLD( document: Document, album: boolean = false): Promise<RawApplePlaylist|string|undefined> {
    const scripts = DomUtils.findAll(element => {
        if (element.type !== 'script')
            return false;

        return element.attribs.type === 'application/ld+json';
    }, document.children);

    for (const script of scripts) {
        let data = JSON.parse(DomUtils.textContent(script));
        if ('@graph' in data)
            data = data['@graph'];
        if (data['@type'] === 'MusicAlbum' && !album)
            return data.byArtist.name as string;
        if(data['@type'] === 'MusicAlbum' && album) {
            let { name, byArtist, tracks } = data;
            return {
                type: 'album',
                name: name as string,
                author: byArtist.name as string,
                tracks: tracks.map((songData: any) => {
                    return {
                        artist: byArtist.name as string,
                        title: songData.name as string
                    }
                })
            };
        } 
        if (data['@type'] === 'MusicPlaylist') {
            let { name, author, track } = data;
            return {
                type: 'playlist',
                name: name as string,
                author: author.name as string,
                tracks: await Promise.all(
                    track.map(async (songData: any) => await getSong(songData.url, true))
                ).catch(() => []) as any[]
            };
        }
    }
};

/**
 * @param {string} url
 * @returns {Promise<RawAppleSong>}
 */
export async function getSong(url: string, playlist: boolean = false): Promise<RawAppleSong| undefined> {
    const result = await axios.get<string>(url);
    const document = parseDocument(result.data);

    const artist = await findJSONLD(document) as string;
    const regexName = RegExp(/https?:\/\/music\.apple\.com\/.+?\/.+?\/(.+?)\//);
    const title = regexName.exec(url)?.[1] as string;

    const song: RawAppleSong = {
        artist,
        title,
    }

    if (playlist === false){
        song.type = "song"
    }

    return song;
};

/**
 * @param {string} url
 * @returns {Promise<?RawApplePlaylist>}
 */
export async function getPlaylist(url: string): Promise<RawApplePlaylist|undefined> {
    const result = await axios.get<string>(url);
    const document = parseDocument(result.data);
    return await findJSONLD( document, true ) as RawApplePlaylist;
};


/**
 * @param {string} url
 * @returns {Promise<Promise<RawApplePlaylist|RawAppleSong|undefined>>}
 */
export async function autoGetApple(url: string): Promise<RawApplePlaylist|RawAppleSong|undefined> {
    if (RegExp(/https?:\/\/music\.apple\.com\/.+?\/playlist\//).test(url) || (!url.includes("?i="))){
        return await getPlaylist(url)
    };
    if (RegExp(/https?:\/\/music\.apple\.com\/.+?\/album\/.+?\/.+?\?i=/).test(url)){
        return await getSong(url)
    };
};

