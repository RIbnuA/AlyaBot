const axios = require('axios');

async function fetchJson(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Fetch JSON error:', error);
        return null;
    }
}

async function handleDownload(nvdia, msg, url, platform) {
    try {
        if (!url || !platform) {
            return await nvdia.sendMessage(msg.key.remoteJid, {
                text: '*Format tidak valid!*\n\nContoh: download <url>|<platform>',
                quoted: msg
            });
        }

        const platformHandlers = {
            'instagram': async () => {
                const igApi = `https://btch.us.kg/download/igdl?url=${encodeURIComponent(url)}`;
                const igResponse = await fetchJson(igApi);

                if (igResponse?.status && igResponse.result.length > 0) {
                    const { url: videoUrl, thumbnail } = igResponse.result[0];
                    return await nvdia.sendMessage(msg.key.remoteJid, {
                        video: { url: videoUrl },
                        caption: `?? *Video Instagram*`,
                        contextInfo: {
                            externalAdReply: {
                                title: "Instagram Downloader",
                                body: "???????????? ???? ??",
                                thumbnailUrl: thumbnail,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: msg });
                }
                throw new Error('Failed to download Instagram content');
            },
            'facebook': async () => {
                const fbApi = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`;
                const fbResponse = await fetchJson(fbApi);

                if (fbResponse?.status && fbResponse.data) {
                    const { video, thumbnail, userInfo } = fbResponse.data;
                    return await nvdia.sendMessage(msg.key.remoteJid, {
                        video: { url: video },
                        caption: `?? *Video Facebook* \n\n?? *Nama*: ${userInfo.name}\n?? *Sumber*: ${url}`,
                        contextInfo: {
                            externalAdReply: {
                                title: "Facebook Downloader",
                                body: "???????????? ???? ??",
                                thumbnailUrl: thumbnail,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: msg });
                }
                throw new Error('Failed to download Facebook content');
            },
            'tiktok': async () => {
                const tiktokApi = `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`;
                const tiktokResponse = await fetchJson(tiktokApi);

                if (tiktokResponse?.status === 200 && tiktokResponse.data) {
                    const { data } = tiktokResponse;
                    const { title, data: videoData, cover, author, music_info, stats } = data;
                    const videoUrl = videoData.find(v => v.type === "nowatermark").url;
                    
                    return await nvdia.sendMessage(msg.key.remoteJid, {
                        video: { url: videoUrl },
                        caption: `?? *Video TikTok*\n\n*Title*: ${title}\n*Music*: ${music_info.title}\n*Author*: ${author.nickname}\n*Views*: ${stats.views}`,
                        contextInfo: {
                            externalAdReply: {
                                title: "TikTok Downloader",
                                body: "???????????? ???? ??",
                                thumbnailUrl: cover,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: msg });
                }
                throw new Error('Failed to download TikTok content');
            },
            'twitter': async () => {
                const twitterApi = `https://api.agatz.xyz/api/twitter?url=${encodeURIComponent(url)}`;
                const twitterResponse = await fetchJson(twitterApi);

                if (twitterResponse?.status === 200 && twitterResponse.data) {
                    const { video_hd, thumb, desc } = twitterResponse.data;
                    return await nvdia.sendMessage(msg.key.remoteJid, {
                        video: { url: video_hd },
                        caption: `?? *Video Twitter*\n\n*Description*: ${desc}\n*URL*: ${url}`,
                        contextInfo: {
                            externalAdReply: {
                                title: "Twitter Downloader",
                                body: "???????????? ???? ??",
                                thumbnailUrl: thumb,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: msg });
                }
                throw new Error('Failed to download Twitter content');
            },
            'ytmp3': async () => {
                const ytmp3Api = `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(url)}`;
                const ytmp3Response = await fetchJson(ytmp3Api);

                if (ytmp3Response?.title && ytmp3Response.downloadUrl) {
                    const { title, downloadUrl, thumbnail } = ytmp3Response;
                    return await nvdia.sendMessage(msg.key.remoteJid, {
                        audio: { url: downloadUrl },
                        mimetype: 'audio/mp4',
                        caption: `?? *YouTube MP3*\n\n*Title*: ${title}`,
                        contextInfo: {
                            externalAdReply: {
                                title: "YouTube MP3 Downloader",
                                body: "???????????? ???? ??",
                                thumbnailUrl: thumbnail,
                                mediaType: 2,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: msg });
                }
                throw new Error('Failed to download YouTube MP3');
            },
            'ytmp4': async () => {
                const ytmp4Api = `https://api.agatz.xyz/api/ytmp4?url=${encodeURIComponent(url)}`;
                const ytmp4Response = await fetchJson(ytmp4Api);

                if (ytmp4Response?.status === 200 && ytmp4Response.data.success) {
                    const { title, downloadUrl, image } = ytmp4Response.data;
                    return await nvdia.sendMessage(msg.key.remoteJid, {
                        video: { url: downloadUrl },
                        caption: `?? *YouTube MP4*\n\n*Title*: ${title}`,
                        contextInfo: {
                            externalAdReply: {
                                title: "YouTube MP4 Downloader",
                                body: "???????????? ???? ??",
                                thumbnailUrl: image,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: msg });
                }
                throw new Error('Failed to download YouTube MP4');
            }
        };

        const platformLower = platform.toLowerCase();
        const platformHandler = Object.keys(platformHandlers).find(p => 
            platformLower.includes(p) || platformLower.includes(p.replace('mp', ''))
        );

        if (platformHandler) {
            await platformHandlers[platformHandler]();
        } else {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: '*Platform tidak didukung!* Saat ini hanya mendukung Instagram, Facebook, TikTok, Twitter, YouTube MP3, dan YouTube MP4.',
                quoted: msg
            });
        }
    } catch (error) {
        console.error('Download error:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `*Gagal mengunduh: ${error.message}*\nCek kembali tautan Anda!`,
            quoted: msg
        });
    }
}

module.exports = handleDownload;
