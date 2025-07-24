/**
 * Gitroll Code Analysis Fetcher (Node.js compatible)
 *
 * This script fetches code analysis results from Gitroll API using built-in modules
 * and stores them in a structured format for systematic issue resolution.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const GITROLL_API_URL = 'https://gitroll.io/api/repo-scan/boM5KtnIi4oXKixpa6YD/issues?p=1&ps=150';
const OUTPUT_DIR = path.join(__dirname, 'output');
const ANALYSIS_FILE = path.join(OUTPUT_DIR, 'gitroll-analysis.json');
const SUMMARY_FILE = path.join(OUTPUT_DIR, 'gitroll-summary.md');
const TODO_FILE = path.join(OUTPUT_DIR, 'gitroll-todo.md');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Make HTTPS request
 */
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, response => {
            let data = '';

            response.on('data', chunk => {
                data += chunk;
            });

            response.on('end', () => {
                if (response.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error(`Failed to parse JSON: ${error.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                }
            });
        });

        request.on('error', error => {
            reject(error);
        });

        request.setTimeout(30000, () => {
            request.abort();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Fetch analysis data from Gitroll API
 */
async function fetchAnalysis() {
    console.log('🔍 Fetching code analysis from Gitroll...');

    try {
        const data = await makeRequest(GITROLL_API_URL);
        console.log(`✅ Successfully fetched ${data.issues?.length || 0} issues`);

        return data;
    } catch (error) {
        console.error('❌ Error fetching analysis:', error.message);
        throw error;
    }
}

/**
 * Categorize issues by type and severity
 */
function categorizeIssues(issues) {
    const categories = {
        bugs: [],
        vulnerabilities: [],
        codeSmells: [],
        duplications: [],
        coverage: [],
        maintainability: [],
        reliability: [],
        security: [],
        performance: [],
        other: [],
    };

    const severityLevels = {
        critical: [],
        high: [],
        medium: [],
        low: [],
        info: [],
    };

    issues.forEach(issue => {
        const type = (issue.type || '').toLowerCase();
        const severity = (issue.severity || 'info').toLowerCase();
        const rule = (issue.rule || '').toLowerCase();
        const message = (issue.message || '').toLowerCase();

        // Categorize by type/rule/message content
        if (type.includes('bug') || rule.includes('bug') || message.includes('bug')) {
            categories.bugs.push(issue);
        } else if (
            type.includes('vulnerability') ||
            type.includes('security') ||
            rule.includes('security')
        ) {
            categories.vulnerabilities.push(issue);
        } else if (
            type.includes('smell') ||
            type.includes('maintainability') ||
            rule.includes('maintainability')
        ) {
            categories.codeSmells.push(issue);
        } else if (type.includes('duplication') || rule.includes('duplication')) {
            categories.duplications.push(issue);
        } else if (type.includes('coverage') || rule.includes('coverage')) {
            categories.coverage.push(issue);
        } else if (type.includes('reliability') || rule.includes('reliability')) {
            categories.reliability.push(issue);
        } else if (type.includes('performance') || rule.includes('performance')) {
            categories.performance.push(issue);
        } else {
            categories.other.push(issue);
        }

        // Categorize by severity
        if (severityLevels[severity]) {
            severityLevels[severity].push(issue);
        } else {
            severityLevels.info.push(issue);
        }
    });

    return { categories, severityLevels };
}

/**
 * Generate summary markdown
 */
function generateSummary(data, categorized) {
    const timestamp = new Date().toISOString();
    const { categories, severityLevels } = categorized;

    let summary = `# Gitroll Code Analysis Summary\n\n`;
    summary += `**Generated:** ${timestamp}\n`;
    summary += `**Total Issues:** ${data.issues?.length || 0}\n\n`;

    // Severity breakdown
    summary += `## 🚨 Severity Breakdown\n\n`;
    Object.entries(severityLevels).forEach(([severity, issues]) => {
        if (issues.length > 0) {
            const icon =
                {
                    critical: '🔴',
                    high: '🟠',
                    medium: '🟡',
                    low: '🔵',
                    info: '⚪',
                }[severity] || '⚫';

            summary += `- ${icon} **${severity.toUpperCase()}**: ${issues.length} issues\n`;
        }
    });

    // Category breakdown
    summary += `\n## 📊 Issue Categories\n\n`;
    Object.entries(categories).forEach(([category, issues]) => {
        if (issues.length > 0) {
            const icon =
                {
                    bugs: '🐛',
                    vulnerabilities: '🔒',
                    codeSmells: '👃',
                    duplications: '📋',
                    coverage: '📊',
                    maintainability: '🔧',
                    reliability: '⚡',
                    security: '🛡️',
                    performance: '🚀',
                    other: '❓',
                }[category] || '📝';

            summary += `- ${icon} **${category.charAt(0).toUpperCase() + category.slice(1)}**: ${issues.length} issues\n`;
        }
    });

    // Sample issues by file
    const fileGroups = {};
    data.issues.forEach(issue => {
        const file = issue.component || issue.file || 'Unknown';
        if (!fileGroups[file]) {
            fileGroups[file] = [];
        }
        fileGroups[file].push(issue);
    });

    summary += `\n## 📁 Issues by File (Top 10)\n\n`;
    const sortedFiles = Object.entries(fileGroups)
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 10);

    sortedFiles.forEach(([file, issues]) => {
        summary += `- **${file}**: ${issues.length} issues\n`;
    });

    // Top priority issues
    const highPriorityIssues = [...severityLevels.critical, ...severityLevels.high];
    if (highPriorityIssues.length > 0) {
        summary += `\n## 🔥 High Priority Issues (Top 10)\n\n`;
        highPriorityIssues.slice(0, 10).forEach((issue, index) => {
            summary += `${index + 1}. **${issue.rule || issue.message || 'Issue'}**\n`;
            summary += `   - File: \`${issue.component || issue.file || 'N/A'}\`\n`;
            summary += `   - Line: ${issue.line || 'N/A'}\n`;
            summary += `   - Severity: ${issue.severity || 'N/A'}\n`;
            if (issue.message && issue.message !== issue.rule) {
                summary += `   - Message: ${issue.message}\n`;
            }
            summary += `\n`;
        });
    }

    return summary;
}

/**
 * Generate TODO markdown for systematic resolution
 */
function generateTodo(data, categorized) {
    const timestamp = new Date().toISOString();
    const { categories, severityLevels } = categorized;

    let todo = `# Gitroll Code Analysis TODO\n\n`;
    todo += `**Generated:** ${timestamp}\n`;
    todo += `**Total Issues:** ${data.issues?.length || 0}\n\n`;

    todo += `## 🎯 Resolution Strategy\n\n`;
    todo += `### Phase 1: Critical & High Severity Issues (${severityLevels.critical.length + severityLevels.high.length} issues)\n`;
    todo += `- [ ] Address all CRITICAL severity issues (${severityLevels.critical.length})\n`;
    todo += `- [ ] Address all HIGH severity issues (${severityLevels.high.length})\n\n`;

    todo += `### Phase 2: Security & Reliability (${categories.vulnerabilities.length + categories.reliability.length} issues)\n`;
    todo += `- [ ] Fix all security vulnerabilities (${categories.vulnerabilities.length})\n`;
    todo += `- [ ] Address reliability issues (${categories.reliability.length})\n\n`;

    todo += `### Phase 3: Code Quality (${categories.duplications.length + categories.maintainability.length + categories.performance.length} issues)\n`;
    todo += `- [ ] Remove code duplications (${categories.duplications.length})\n`;
    todo += `- [ ] Fix maintainability issues (${categories.maintainability.length})\n`;
    todo += `- [ ] Address performance concerns (${categories.performance.length})\n\n`;

    todo += `### Phase 4: Code Smells & Minor Issues (${categories.codeSmells.length + severityLevels.medium.length + severityLevels.low.length} issues)\n`;
    todo += `- [ ] Clean up code smells (${categories.codeSmells.length})\n`;
    todo += `- [ ] Address medium priority issues (${severityLevels.medium.length})\n`;
    todo += `- [ ] Address low priority issues (${severityLevels.low.length})\n\n`;

    // Progress tracking
    todo += `## 📊 Progress Tracking\n\n`;
    todo += `| Phase | Total Issues | Completed | Remaining | Progress |\n`;
    todo += `|-------|-------------|-----------|-----------|----------|\n`;
    todo += `| Phase 1 | ${severityLevels.critical.length + severityLevels.high.length} | 0 | ${severityLevels.critical.length + severityLevels.high.length} | 0% |\n`;
    todo += `| Phase 2 | ${categories.vulnerabilities.length + categories.reliability.length} | 0 | ${categories.vulnerabilities.length + categories.reliability.length} | 0% |\n`;
    todo += `| Phase 3 | ${categories.duplications.length + categories.maintainability.length + categories.performance.length} | 0 | ${categories.duplications.length + categories.maintainability.length + categories.performance.length} | 0% |\n`;
    todo += `| Phase 4 | ${categories.codeSmells.length + severityLevels.medium.length + severityLevels.low.length} | 0 | ${categories.codeSmells.length + severityLevels.medium.length + severityLevels.low.length} | 0% |\n`;
    todo += `| **Total** | **${data.issues.length}** | **0** | **${data.issues.length}** | **0%** |\n\n`;

    // Helper function to add issue section
    function addIssueSection(title, issues, icon = '📝') {
        if (issues.length === 0) return;

        todo += `### ${icon} ${title} (${issues.length})\n\n`;
        issues.forEach((issue, index) => {
            const issueTitle = issue.rule || issue.message || `Issue ${index + 1}`;
            todo += `#### ${index + 1}. ${issueTitle}\n`;
            todo += `- [ ] **File:** \`${issue.component || issue.file || 'N/A'}\`\n`;
            todo += `- [ ] **Line:** ${issue.line || 'N/A'}\n`;
            todo += `- [ ] **Severity:** ${issue.severity || 'N/A'}\n`;
            todo += `- [ ] **Type:** ${issue.type || 'N/A'}\n`;
            if (issue.message && issue.message !== issue.rule) {
                todo += `- [ ] **Message:** ${issue.message}\n`;
            }
            if (issue.effort) {
                todo += `- [ ] **Effort:** ${issue.effort}\n`;
            }
            if (issue.debt) {
                todo += `- [ ] **Technical Debt:** ${issue.debt}\n`;
            }
            todo += `\n`;
        });
    }

    // Detailed issue lists by priority
    todo += `## 📋 Detailed Issue Lists\n\n`;

    // Critical issues
    addIssueSection('Critical Issues', severityLevels.critical, '🔴');

    // High severity issues
    addIssueSection('High Severity Issues', severityLevels.high, '🟠');

    // Security vulnerabilities
    addIssueSection('Security Vulnerabilities', categories.vulnerabilities, '🔒');

    // Bugs
    addIssueSection('Bugs', categories.bugs, '🐛');

    // Reliability issues
    addIssueSection('Reliability Issues', categories.reliability, '⚡');

    return todo;
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('🚀 Starting Gitroll code analysis fetch...\n');

        // Fetch analysis data
        const data = await fetchAnalysis();

        if (!data.issues || data.issues.length === 0) {
            console.log('ℹ️ No issues found in the analysis.');
            return;
        }

        // Save raw data
        console.log('💾 Saving raw analysis data...');
        fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(data, null, 2), 'utf8');

        // Categorize issues
        console.log('📊 Categorizing issues...');
        const categorized = categorizeIssues(data.issues);

        // Generate summary
        console.log('📋 Generating summary...');
        const summary = generateSummary(data, categorized);
        fs.writeFileSync(SUMMARY_FILE, summary, 'utf8');

        // Generate TODO
        console.log('✅ Generating TODO list...');
        const todo = generateTodo(data, categorized);
        fs.writeFileSync(TODO_FILE, todo, 'utf8');

        console.log('\n🎉 Analysis complete! Files generated:');
        console.log(`   📄 Raw data: ${ANALYSIS_FILE}`);
        console.log(`   📊 Summary: ${SUMMARY_FILE}`);
        console.log(`   ✅ TODO: ${TODO_FILE}`);

        // Print quick summary
        console.log('\n📈 Quick Summary:');
        console.log(`   Total Issues: ${data.issues.length}`);
        console.log(`   Critical: ${categorized.severityLevels.critical.length}`);
        console.log(`   High: ${categorized.severityLevels.high.length}`);
        console.log(`   Medium: ${categorized.severityLevels.medium.length}`);
        console.log(`   Low: ${categorized.severityLevels.low.length}`);
        console.log(`   Info: ${categorized.severityLevels.info.length}`);

        console.log('\n🔥 High Priority Count:');
        console.log(`   Bugs: ${categorized.categories.bugs.length}`);
        console.log(`   Security: ${categorized.categories.vulnerabilities.length}`);
        console.log(`   Reliability: ${categorized.categories.reliability.length}`);
    } catch (error) {
        console.error('💥 Script failed:', error.message);
        throw error;
    }
}

// Run the script
main();
