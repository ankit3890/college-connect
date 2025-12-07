const API_URL = 'http://localhost:5503';

async function testEdit() {
    try {
        console.log("Listing posts...");
        const listRes = await fetch(`${API_URL}/api/post/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ community: 'general' })
        });
        const posts = await listRes.json();
        
        if (posts.length === 0) {
            console.log("No posts to edit.");
            return;
        }

        const post = posts[0];
        console.log(`Editing post ${post._id}...`);

        const editRes = await fetch(`${API_URL}/api/post/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                postId: post._id, 
                username: post.author, 
                title: post.title + " (Edited)", 
                content: post.content + " [Updated]" 
            })
        });
        
        const editData = await editRes.json();
        console.log("Edit Response:", editData);

        if (editData.success) {
            console.log("Verifying edit...");
            const verifyRes = await fetch(`${API_URL}/api/post/list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ community: 'general' })
            });
            const verifyPosts = await verifyRes.json();
            const editedPost = verifyPosts.find(p => p._id === post._id);
            console.log("Is Edited:", editedPost.isEdited);
            console.log("New Title:", editedPost.title);
        }

    } catch (err) {
        console.error("Test failed:", err);
    }
}

testEdit();
