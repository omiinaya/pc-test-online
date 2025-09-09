<script>
export default {
    name: 'AboutPage',
    computed: {
        buildInfo() {
            return `${import.meta.env.MODE}-${Date.now().toString(36)}`;
        },
        environment() {
            return import.meta.env.DEV ? this.$t('about.version.environment_dev') : this.$t('about.version.environment_prod');
        },
    },
};
</script>

<template>
    <div class="about-page">
        <div class="page-container">
            <!-- Hero Section -->
            <header class="about-hero">
                <div class="hero-content">
                    <div class="app-logo">
                        <img src="/favicon.svg" :alt="$t('app.name')" class="logo-image" />
                    </div>
                    <h1 class="hero-title">{{ $t('about.title') }}</h1>
                    <p class="hero-subtitle">
                        {{ $t('about.subtitle') }}
                    </p>
                </div>
            </header>

            <!-- Main Content -->
            <div class="about-content">
                <!-- What is MMIT Lab Section -->
                <section class="content-section">
                    <h2 class="section-title">{{ $t('about.what_is_mmit.title') }}</h2>
                    <div class="section-content">
                        <p v-for="(paragraph, index) in $t('about.what_is_mmit.paragraphs')" :key="index">
                            {{ paragraph }}
                        </p>
                    </div>
                </section>

                <!-- Features Section -->
                <section class="content-section">
                    <h2 class="section-title">{{ $t('about.features.title') }}</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📷</div>
                            <h3 class="feature-title">{{ $t('about.features.camera.title') }}</h3>
                            <p class="feature-description">
                                {{ $t('about.features.camera.description') }}
                            </p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">🎤</div>
                            <h3 class="feature-title">{{ $t('about.features.audio.title') }}</h3>
                            <p class="feature-description">
                                {{ $t('about.features.audio.description') }}
                            </p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">⌨️</div>
                            <h3 class="feature-title">{{ $t('about.features.input.title') }}</h3>
                            <p class="feature-description">
                                {{ $t('about.features.input.description') }}
                            </p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">🔋</div>
                            <h3 class="feature-title">{{ $t('about.features.battery.title') }}</h3>
                            <p class="feature-description">
                                {{ $t('about.features.battery.description') }}
                            </p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3 class="feature-title">{{ $t('about.features.performance.title') }}</h3>
                            <p class="feature-description">
                                {{ $t('about.features.performance.description') }}
                            </p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">📋</div>
                            <h3 class="feature-title">{{ $t('about.features.reports.title') }}</h3>
                            <p class="feature-description">
                                {{ $t('about.features.reports.description') }}
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Technology Section -->
                <section class="content-section">
                    <h2 class="section-title">{{ $t('about.technology.title') }}</h2>
                    <div class="tech-stack">
                        <div class="tech-category">
                            <h3>{{ $t('about.technology.frontend') }}</h3>
                            <div class="tech-tags">
                                <span class="tech-tag">Vue.js 3</span>
                                <span class="tech-tag">JavaScript</span>
                                <span class="tech-tag">CSS3</span>
                                <span class="tech-tag">WebRTC</span>
                                <span class="tech-tag">Web APIs</span>
                            </div>
                        </div>

                        <div class="tech-category">
                            <h3>{{ $t('about.technology.testing') }}</h3>
                            <div class="tech-tags">
                                <span class="tech-tag">MediaDevices API</span>
                                <span class="tech-tag">Battery API</span>
                                <span class="tech-tag">Touch Events</span>
                                <span class="tech-tag">Keyboard API</span>
                                <span class="tech-tag">Web Vitals</span>
                            </div>
                        </div>

                        <div class="tech-category">
                            <h3>{{ $t('about.technology.tools') }}</h3>
                            <div class="tech-tags">
                                <span class="tech-tag">Vite</span>
                                <span class="tech-tag">TypeScript</span>
                                <span class="tech-tag">jsPDF</span>
                                <span class="tech-tag">html2canvas</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Version Info Section -->
                <section class="content-section">
                    <h2 class="section-title">{{ $t('about.version.title') }}</h2>
                    <div class="version-info">
                        <div class="version-card">
                            <div class="version-header">
                                <h3>{{ $t('about.version.current_version') }}</h3>
                                <span class="version-number">v2.0.0</span>
                            </div>
                            <div class="version-details">
                                <p><strong>{{ $t('about.version.release_date') }}:</strong> January 2025</p>
                                <p><strong>{{ $t('about.version.build') }}:</strong> {{ buildInfo }}</p>
                                <p><strong>{{ $t('about.version.environment') }}:</strong> {{ environment }}</p>
                            </div>
                        </div>

                        <div class="changelog-preview">
                            <h3>{{ $t('about.version.recent_updates') }}</h3>
                            <ul class="changelog-list">
                                <li v-for="(update, index) in $t('about.version.updates')" :key="index">{{ update }}</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- Contact/Support Section -->
                <section class="content-section">
                    <h2 class="section-title">{{ $t('about.support.title') }}</h2>
                    <div class="contact-grid">
                        <div class="contact-card">
                            <div class="contact-icon">📧</div>
                            <h3>{{ $t('about.support.email.title') }}</h3>
                            <p>support@mmitlab.com</p>
                            <p class="contact-note">{{ $t('about.support.email.response_time') }}</p>
                        </div>

                        <div class="contact-card">
                            <div class="contact-icon">📖</div>
                            <h3>{{ $t('about.support.documentation.title') }}</h3>
                            <p>{{ $t('about.support.documentation.description') }}</p>
                            <a href="#" class="contact-link">{{ $t('about.support.documentation.link') }}</a>
                        </div>

                        <div class="contact-card">
                            <div class="contact-icon">🐛</div>
                            <h3>{{ $t('about.support.issues.title') }}</h3>
                            <p>{{ $t('about.support.issues.description') }}</p>
                            <a href="#" class="contact-link">{{ $t('about.support.issues.link') }}</a>
                        </div>
                    </div>
                </section>

                <!-- Credits Section -->
                <section class="content-section">
                    <h2 class="section-title">{{ $t('about.credits.title') }}</h2>
                    <div class="credits-content">
                        <p>
                            {{ $t('about.credits.description') }}
                        </p>

                        <div class="credits-grid">
                            <div class="credit-category">
                                <h3>{{ $t('about.credits.special_thanks') }}</h3>
                                <ul>
                                    <li v-for="(item, index) in $t('about.credits.thanks_list')" :key="index">{{ item }}</li>
                                </ul>
                            </div>

                            <div class="credit-category">
                                <h3>{{ $t('about.credits.icons_assets') }}</h3>
                                <ul>
                                    <li v-for="(item, index) in $t('about.credits.assets_list')" :key="index">{{ item }}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<style scoped>
.about-page {
    min-height: calc(100vh - var(--header-height) - 70px); /* Account for header and footer */
    background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
    color: #e2e8f0;
    padding: 2rem 0;
}

.page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Hero Section */
.about-hero {
    text-align: center;
    padding: 4rem 0;
    margin-bottom: 4rem;
}

.hero-content {
    max-width: 600px;
    margin: 0 auto;
}

.app-logo {
    margin-bottom: 2rem;
}

.logo-image {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(255, 107, 0, 0.3);
}

.hero-title {
    font-size: 3rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #ff6b00 0%, #ff8800 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subtitle {
    font-size: 1.25rem;
    color: #94a3b8;
    line-height: 1.6;
}

/* Content Sections */
.about-content {
    display: flex;
    flex-direction: column;
    gap: 4rem;
}

.content-section {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 16px;
    padding: 3rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
}

.section-title {
    font-size: 2rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 2rem;
    text-align: center;
}

.section-content p {
    font-size: 1.1rem;
    line-height: 1.7;
    color: #cbd5e1;
    margin-bottom: 1.5rem;
}

.section-content p:last-child {
    margin-bottom: 0;
}

/* Features Grid */
.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.feature-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 107, 0, 0.3);
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.feature-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 1rem;
}

.feature-description {
    color: #94a3b8;
    line-height: 1.6;
}

/* Technology Stack */
.tech-stack {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.tech-category h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 1rem;
}

.tech-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tech-tag {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: #e2e8f0;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Version Info */
.version-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 2rem;
}

.version-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.version-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.version-header h3 {
    font-size: 1.25rem;
    color: #ffffff;
    margin: 0;
}

.version-number {
    background: linear-gradient(135deg, #ff6b00 0%, #ff8800 100%);
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
}

.version-details p {
    color: #94a3b8;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
}

.version-details p:last-child {
    margin-bottom: 0;
}

.changelog-preview h3 {
    font-size: 1.25rem;
    color: #ffffff;
    margin-bottom: 1rem;
}

.changelog-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.changelog-list li {
    color: #94a3b8;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
}

/* Contact Grid */
.contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.contact-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.contact-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.contact-card h3 {
    font-size: 1.25rem;
    color: #ffffff;
    margin-bottom: 1rem;
}

.contact-card p {
    color: #94a3b8;
    margin-bottom: 0.5rem;
}

.contact-note {
    font-size: 0.9rem;
    font-style: italic;
}

.contact-link {
    color: #ff9854;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.contact-link:hover {
    color: #ff6b00;
}

/* Credits */
.credits-content p {
    text-align: center;
    font-size: 1.1rem;
    color: #cbd5e1;
    margin-bottom: 2rem;
}

.credits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.credit-category h3 {
    font-size: 1.25rem;
    color: #ffffff;
    margin-bottom: 1rem;
}

.credit-category ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.credit-category li {
    color: #94a3b8;
    margin-bottom: 0.5rem;
    padding-left: 1.5rem;
    position: relative;
}

.credit-category li:before {
    content: '•';
    color: #ff6b00;
    position: absolute;
    left: 0;
    font-weight: bold;
}

/* Responsive Design */
@media (max-width: 768px) {
    .page-container {
        padding: 0 1rem;
    }

    .about-hero {
        padding: 2rem 0;
        margin-bottom: 2rem;
    }

    .hero-title {
        font-size: 2rem;
    }

    .content-section {
        padding: 2rem;
    }

    .features-grid {
        grid-template-columns: 1fr;
    }

    .version-info {
        grid-template-columns: 1fr;
    }

    .contact-grid {
        grid-template-columns: 1fr;
    }

    .credits-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .about-content {
        gap: 2rem;
    }

    .content-section {
        padding: 1.5rem;
    }

    .hero-title {
        font-size: 1.75rem;
    }

    .hero-subtitle {
        font-size: 1.1rem;
    }
}
</style>
