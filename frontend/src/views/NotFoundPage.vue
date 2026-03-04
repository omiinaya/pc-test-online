<script>
export default {
    name: 'NotFoundPage',
    mounted() {
        // Set meta tags for 404 page
        document.title = '404 - Page Not Found | MMIT Lab';
        document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow');
    },
};
</script>

<template>
    <div class="not-found-container">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Page Not Found</h2>
        <p class="error-message">The page you're looking for doesn't exist or has been moved.</p>
        <router-link to="/" class="home-link"> Go back home </router-link>
    </div>
</template>

<style scoped>
.not-found-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    text-align: center;
    background: #0a0a0a;
    color: #fff;
}

.error-code {
    font-size: 8rem;
    font-weight: bold;
    color: #ffc107;
    margin: 0;
    line-height: 1;
}

.error-title {
    font-size: 2rem;
    margin: 1rem 0;
    color: #fff;
}

.error-message {
    font-size: 1.2rem;
    color: #ccc;
    margin-bottom: 2rem;
    max-width: 400px;
}

.home-link {
    display: inline-block;
    padding: 1rem 2rem;
    background: #ffc107;
    color: #000;
    text-decoration: none;
    border-radius: 8px;
    font-weight: bold;
    transition:
        transform 0.2s,
        box-shadow 0.2s;
}

.home-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
}
</style>
