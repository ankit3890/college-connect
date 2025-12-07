const API_URL = 'http://localhost:5503';

async function testPostFlow() {
    try {
        console.log("1. Testing Post Creation...");
        const form = new FormData();
        form.append('title', 'Test Post Title');
        form.append('content', 'Test Post Content');
        form.append('community', 'general');
        form.append('author', 'testuser');
        
        // Native fetch with FormData automatically sets the correct Content-Type with boundary
        const createRes = await fetch(`${API_URL}/api/post/create`, {
            method: 'POST',
            body: form
        });
        
        const createData = await createRes.json();
        console.log("Create Post Response:", createData);

        console.log("\n2. Testing Post Listing...");
        const listRes = await fetch(`${API_URL}/api/post/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ community: 'general' })
        });
        
        const listData = await listRes.json();
        console.log("List Posts Response: Found", listData.length, "posts");

        if (listData.length > 0) {
            const postId = listData[0]._id;
            console.log("\n3. Testing Upvote...");
            const voteRes = await fetch(`${API_URL}/api/post/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, username: 'testuser', type: 'up' })
            });
            const voteData = await voteRes.json();
            console.log("Upvote Response:", voteData);
        }

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testPostFlow();
