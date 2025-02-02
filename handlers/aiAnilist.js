const axios = require('axios');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function translate(text, lang = 'id') {
    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
        const data = await res.json();
        const hasil = data[0][0][0];
        return {
            status: true,
            result: {
                tr: hasil
            }
        };
    } catch {
        return {
            status: false,
            result: {
                tr: text
            }
        };
    }
}

async function searchAnilist(query) {
    try {
        const { data } = await axios.get(`https://anilist.co/search/anime?query=${encodeURIComponent(query)}`);
        const $ = cheerio.load(data);

        const results = [];

        $('.media-card').each((index, element) => {
            const title = $(element).find('.title').text().trim();
            const imageUrl = $(element).find('.image').attr('src');
            const link = $(element).find('.cover').attr('href');

            if (title && imageUrl && link) {
                results.push({
                    title,
                    imageUrl,
                    link: `https://anilist.co${link}`
                });
            }
        });

        return results;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function getAnilistDetail(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const cleanText = (text) => text.replace(/\n\s+/g, ' ').trim();

        const safeTranslate = async (text) => {
            const translation = await translate(text);
            return translation.result.tr;
        };

        const descriptionText = cleanText($('.description.content-wrap').text());
        const descriptionParagraphs = descriptionText.split('\n').filter(p => p.trim() !== '');
        const translatedParagraphs = await Promise.all(
            descriptionParagraphs.map(paragraph => safeTranslate(paragraph))
        );

        const results = {
            title: {
                romaji: cleanText($('.content h1').first().text()),
                english: cleanText($('div.data-set:contains("English") .value').text()),
                native: cleanText($('div.data-set:contains("Native") .value').text()),
                translated: {
                    romaji: await safeTranslate(cleanText($('.content h1').first().text())),
                    english: await safeTranslate(cleanText($('div.data-set:contains("English") .value').text())),
                    native: await safeTranslate(cleanText($('div.data-set:contains("Native") .value').text()))
                }
            },
            description: {
                original: descriptionText,
                translated: translatedParagraphs.join('\n\n')
            },
            cover: $('.cover-wrap-inner .cover').attr('src'),
            banner: $('.banner').css('background-image') ?
                $('.banner').css('background-image').replace(/^url\(\s*['"]?|['"]?\s*\)$/g, '') : null,
            details: {
                format: cleanText($('div.data-set:contains("Format") .value').text()),
                episodes: cleanText($('div.data-set:contains("Episodes") .value').text()),
                status: cleanText($('div.data-set:contains("Status") .value').text()),
                season: cleanText($('div.data-set:contains("Season") .value').text()),
                averageScore: cleanText($('div.data-set:contains("Average Score") .value').text()),
                popularity: cleanText($('div.data-set:contains("Popularity") .value').text())
            },
            genres: {
                original: $('div.data-set:contains("Genres") .value a').map((i, el) => cleanText($(el).text())).get().join(', '),
                translated: await Promise.all(
                    $('div.data-set:contains("Genres") .value a').map((i, el) => safeTranslate(cleanText($(el).text()))).get()
                )
            }
        };

        return results;
    } catch (error) {
        return { error: error.message };
    }
}

async function getPopularAnime() {
    try {
        const url = 'https://anilist.co';
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const scrapeSection = (selector) => {
            return $(selector).map((index, element) => {
                const title = $(element).find('.title').text().trim();
                const link = url + $(element).find('a.cover').attr('href');
                const image = $(element).find('img.image').attr('src');
                const rank = $(element).find('.rank').text().trim();

                return { rank, title, link, image };
            }).get();
        };

        return {
            trending: scrapeSection('.landing-section.trending .results .media-card'),
            populer: scrapeSection('.landing-section.season .results .media-card'),
            upcoming: scrapeSection('.landing-section.nextSeason .results .media-card'),
            top: scrapeSection('.landing-section.top .results .media-card')
        };
    } catch (error) {
        console.error('Error scraping AniList:', error);
        return null;
    }
}

// Handler functions
async function handleAnilistSearch(nvdia, msg, query) {
    try {
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '⌛ Searching for anime...'
        }, { quoted: msg });

        // GraphQL query untuk mencari anime
        const graphqlQuery = {
            query: `
                query ($search: String) {
                    Page(page: 1, perPage: 10) {
                        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
                            id
                            title {
                                romaji
                                english
                                native
                            }
                        }
                    }
                }
            `,
            variables: {
                search: query
            }
        };

        // Menggunakan Anilist GraphQL API
        const { data } = await axios.post('https://graphql.anilist.co', graphqlQuery);

        if (!data.data.Page.media || data.data.Page.media.length === 0) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: '❌ No results found.'
            }, { quoted: msg });
            return;
        }

        // Format hasil pencarian
        let messageText = '*🎌 Anime Search Results:*\n\n';
        data.data.Page.media.forEach((anime, index) => {
            const title = anime.title.english || anime.title.romaji || anime.title.native;
            messageText += `${index + 1}. *${title}*\n`;
            messageText += `➥ https://anilist.co/anime/${anime.id}\n\n`;
        });

        // Kirim hasil
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: messageText
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in Anilist search:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '❌ Error occurred while searching.'
        }, { quoted: msg });
    }
}

async function handleAnilistDetail(nvdia, msg, url) {
    try {
        const loadingMsg = await nvdia.sendMessage(msg.key.remoteJid, {
            text: '⌛ Getting anime details...'
        }, { quoted: msg });

        const details = await getAnilistDetail(url);
        
        if (!details || details.error) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get anime details.'
            }, { quoted: msg });
            return;
        }

        let messageText = '*?? Anime Details:*\n\n';
        messageText += `*Title:* ${details.title.romaji}\n`;
        messageText += `*English:* ${details.title.english || 'N/A'}\n`;
        messageText += `*Native:* ${details.title.native || 'N/A'}\n\n`;
        messageText += `*Format:* ${details.details.format || 'N/A'}\n`;
        messageText += `*Episodes:* ${details.details.episodes || 'N/A'}\n`;
        messageText += `*Status:* ${details.details.status || 'N/A'}\n`;
        messageText += `*Season:* ${details.details.season || 'N/A'}\n`;
        messageText += `*Score:* ${details.details.averageScore || 'N/A'}\n`;
        messageText += `*Popularity:* ${details.details.popularity || 'N/A'}\n\n`;
        messageText += `*Genres:* ${details.genres.original}\n\n`;
        messageText += `*Description:*\n${details.description.translated}\n`;

        await nvdia.sendMessage(msg.key.remoteJid, {
            image: { url: details.cover },
            caption: messageText
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in Anilist detail:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '❌ Error occurred while getting anime details.'
        }, { quoted: msg });
    }
}

async function handleAnilistPopular(nvdia, msg) {
    try {
        const loadingMsg = await nvdia.sendMessage(msg.key.remoteJid, {
            text: '⌛ Getting popular anime...'
        }, { quoted: msg });

        const popular = await getPopularAnime();
        
        if (!popular) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get popular anime.'
            }, { quoted: msg });
            return;
        }

        const formatSection = (section, title) => {
            let text = `*${title}:*\n\n`;
            section.slice(0, 5).forEach((anime, i) => {
                text += `${i + 1}. ${anime.title}\n`;
                text += `   Link: ${anime.link}\n\n`;
            });
            return text;
        };

        let messageText = '*?? Popular Anime*\n\n';
        messageText += formatSection(popular.trending, 'Trending Now');
        messageText += formatSection(popular.populer, 'Popular This Season');
        messageText += formatSection(popular.upcoming, 'Upcoming Next Season');
        messageText += formatSection(popular.top, 'All Time Popular');

        await nvdia.sendMessage(msg.key.remoteJid, {
            image: { url: popular.trending[0].image },
            caption: messageText
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in Anilist popular:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '❌ Error occurred while getting popular anime.'
        }, { quoted: msg });
    }
}

module.exports = {
    handleAnilistSearch,
    handleAnilistDetail,
    handleAnilistPopular
};
