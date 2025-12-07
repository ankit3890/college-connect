const API_URL = 'http://localhost:5503';

async function debugVote() {
    try {
        console.log("Listing posts...");
        const listRes = await fetch(`${API_URL}/api/post/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ community: 'general' })
        });
        const posts = await listRes.json();
        console.log(`Found ${posts.length} posts`);

        if (posts.length === 0) {
            console.log("No posts found. Creating one...");
            // Create a post if none exist
            const form = new FormData();
            form.append('title', 'Debug Post');
            form.append('content', 'Debug Content');
            form.append('community', 'general');
            form.append('author', 'debuguser');
            await fetch(`${API_URL}/api/post/create`, { method: 'POST', body: form });
            console.log("Post created. Re-listing...");
            return debugVote();
        }

        const postId = posts[0]._id;
        console.log(`Voting on post ${postId}...`);

        const voteRes = await fetch(`${API_URL}/api/post/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, username: 'debuguser', type: 'up' })
        });
        
        const voteData = await voteRes.json();
        console.log("Vote Response:", JSON.stringify(voteData, null, 2));

    } catch (err) {
        console.error("Debug failed:", err);
    }
}

debugVote();
