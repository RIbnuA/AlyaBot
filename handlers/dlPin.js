const axios = require('axios');
const cheerio = require('cheerio');

const pindl = {
    video: async (url) => {
        try {
            let { data: html } = await axios.get(url);
            let $ = cheerio.load(html);

            const mediaDataScript = $('script[data-test-id="video-snippet"]');
            if (mediaDataScript.length) {
                const mediaData = JSON.parse(mediaDataScript.html());

                if (mediaData["@type"] === "VideoObject" && mediaData.contentUrl && mediaData.contentUrl.endsWith(".mp4")) {
                    return {
                        type: "video",
                        name: mediaData.name,
                        description: mediaData.description,
                        contentUrl: mediaData.contentUrl,
                        thumbnailUrl: mediaData.thumbnailUrl,
                        uploadDate: mediaData.uploadDate,
                        duration: mediaData.duration,
                        commentCount: mediaData.commentCount,
                        likeCount: mediaData.interactionStatistic?.find(
                            (stat) => stat.InteractionType["@type"] === "https://schema.org/LikeAction"
                        )?.InteractionCount,
                        watchCount: mediaData.interactionStatistic?.find(
                            (stat) => stat.InteractionType["@type"] === "https://schema.org/WatchAction"
                        )?.InteractionCount,
                        creator: mediaData.creator?.name,
                        creatorUrl: mediaData.creator?.url,
                        keywords: mediaData.keywords,
                    };
                }
            }
            return null;
        } catch (error) {
            return { error: "Error fetching video data" };
        }
    },

    image: async (url) => {
        try {
            let { data: html } = await axios.get(url);
            let $ = cheerio.load(html);

            const mediaDataScript = $('script[data-test-id="leaf-snippet"]');
            if (mediaDataScript.length) {
                const mediaData = JSON.parse(mediaDataScript.html());

                if (
                    mediaData["@type"] === "SocialMediaPosting" &&
                    mediaData.image &&
                    (mediaData.image.endsWith(".png") ||
                        mediaData.image.endsWith(".jpg") ||
                        mediaData.image.endsWith(".jpeg") ||
                        mediaData.image.endsWith(".webp")) &&
                    !mediaData.image.endsWith(".gif")
                ) {
                    return {
                        type: "image",
                        author: mediaData.author?.name,
                        authorUrl: mediaData.author?.url,
                        headline: mediaData.headline,
                        articleBody: mediaData.articleBody,
                        image: mediaData.image,
                        datePublished: mediaData.datePublished,
                        sharedContentUrl: mediaData.sharedContent?.url,
                        isRelatedTo: mediaData.isRelatedTo,
                        mainEntityOfPage: mediaData.mainEntityOfPage?.["@id"],
                    };
                }
            }
            return null;
        } catch (error) {
            return { error: "Error fetching image data" };
        }
    },

    gif: async (url) => {
        try {
            let { data: html } = await axios.get(url);
            let $ = cheerio.load(html);

            const mediaDataScript = $('script[data-test-id="leaf-snippet"]');
            if (mediaDataScript.length) {
                const mediaData = JSON.parse(mediaDataScript.html());

                if (
                    mediaData["@type"] === "SocialMediaPosting" &&
                    mediaData.image &&
                    mediaData.image.endsWith(".gif")
                ) {
                    return {
                        type: "gif",
                        author: mediaData.author?.name,
                        authorUrl: mediaData.author?.url,
                        headline: mediaData.headline,
                        articleBody: mediaData.articleBody,
                        gif: mediaData.image,
                        datePublished: mediaData.datePublished,
                        sharedContentUrl: mediaData.sharedContent?.url,
                        isRelatedTo: mediaData.isRelatedTo,
                        mainEntityOfPage: mediaData.mainEntityOfPage?.["@id"],
                    };
                }
            }
            return null;
        } catch (error) {
            return { error: "Error fetching gif data" };
        }
    },

    download: async (urlPin) => {
        let result = await pindl.video(urlPin);
        if (result) return result;

        result = await pindl.image(urlPin);
        if (result) return result;

        result = await pindl.gif(urlPin);
        return result || { error: "No media found" };
    },
};

const handlePin = async (nvdia, msg, url) => {
    if (!url) {
        await nvdia.sendMessage(msg.key.remoteJid, { text: "Url mana." }, { quoted: msg });
        return;
    }

    try {
        const result = await pindl.download(url);
        if (result.error) throw result.error;

        let caption = `done desu\n\n`;

        if (result.type === "video") {
            caption += `*Video Info*:\n> Nama: ${result.name || "N/A"}\n> URL: ${result.contentUrl}\n`;
            await nvdia.sendMessage(msg.key.remoteJid, {
                video: { url: result.contentUrl },
                caption,
                quoted: msg
            });
        } else if (result.type === "image") {
            caption += `*Image Info*:\n> Judul: ${result.headline || "N/A"}\n> URL: ${result.image}\n`;
            await nvdia.sendMessage(msg.key.remoteJid, {
                image: { url: result.image },
                caption,
                quoted: msg
            });
        } else if (result.type === "gif") {
            caption += `*GIF Info*:\n> Judul: ${result.headline || "N/A"}\n> URL: ${result.gif}\n`;
            await nvdia.sendMessage(msg.key.remoteJid, {
                video: { url: result.gif },
                caption,
                quoted: msg
            });
        }
    } catch (error) {
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `ada yg slh ${error}`,
            quoted: msg
        });
    }
};

module.exports = handlePin;
