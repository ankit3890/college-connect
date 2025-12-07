const http = require('http');

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5503,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.log("Response body:", data);
                    reject(new Error("Failed to parse JSON: " + e.message));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

async function run() {
    try {
        console.log("Listing posts...");
        const posts = await postRequest('/api/post/list', { community: 'general' });
        console.log(`Found ${posts.length} posts`);

        if (posts.length > 0) {
            const postId = posts[0]._id;
            console.log(`Voting on ${postId}...`);
            const voteRes = await postRequest('/api/post/vote', {
                postId: postId,
                username: 'debuguser',
                type: 'up'
            });
            console.log("Vote result:", voteRes);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
