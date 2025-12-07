const API_URL = 'http://localhost:5503';

async function testComments() {
    try {
        console.log("Creating post...");
        const form = new FormData();
        form.append('title', 'Comment Test Post');
        form.append('content', 'Testing comments');
        form.append('community', 'general');
        form.append('author', 'commentuser');
        await fetch(`${API_URL}/api/post/create`, { method: 'POST', body: form });
        
        console.log("Listing posts...");
        const listRes = await fetch(`${API_URL}/api/post/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ community: 'general' })
        });
        const posts = await listRes.json();
        const post = posts[0];
        console.log(`Post ID: ${post._id}`);

        console.log("Adding comment...");
        await fetch(`${API_URL}/api/comment/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post._id, user: 'commentuser', text: 'Hello World' })
        });

        console.log("Listing comments...");
        let commentsRes = await fetch(`${API_URL}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post._id })
        });
        let comments = await commentsRes.json();
        const comment = comments[0];
        console.log(`Comment ID: ${comment._id}, Text: ${comment.text}`);

        console.log("Editing comment...");
        await fetch(`${API_URL}/api/comment/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId: comment._id, user: 'commentuser', text: 'Hello Edited' })
        });

        commentsRes = await fetch(`${API_URL}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post._id })
        });
        comments = await commentsRes.json();
        console.log(`Edited Text: ${comments[0].text}`);

        console.log("Deleting comment...");
        await fetch(`${API_URL}/api/comment/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId: comment._id, user: 'commentuser' })
        });

        commentsRes = await fetch(`${API_URL}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post._id })
        });
        comments = await commentsRes.json();
        console.log(`Comments count: ${comments.length}`);

    } catch (err) {
        console.error("Test failed:", err);
    }
}

testComments();
