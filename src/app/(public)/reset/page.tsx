
'use client';

import { useEffect, useState } from 'react';
import './reset.css';

export default function ResetPage() {
    const [activeTab, setActiveTab] = useState('FirebaseConfig');

    useEffect(() => {
        // By default, show the first tab
        const tablinks = document.getElementsByClassName("tablinks");
        if (tablinks.length > 0) {
            (tablinks[0] as HTMLElement).click();
        }
    }, []);

    const openTab = (evt: React.MouseEvent<HTMLButtonElement>, tabName: string) => {
        setActiveTab(tabName);
        let i;
        const tabcontent = document.getElementsByClassName("tabcontent") as HTMLCollectionOf<HTMLElement>;
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        const tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        const currentTab = document.getElementById(tabName);
        if (currentTab) {
            currentTab.style.display = "block";
        }
        evt.currentTarget.className += " active";
    };

    const runDiagnostics = () => {
        const commands = [
            'node --version',
            'npm --version',
            'firebase --version',
            'find . -name "*.json" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" | grep -E "(firebase|next|package|config|page|app)" | head -20'
        ];
        alert('Run these diagnostic commands:\n\n' + commands.join('\n'));
    };

    const startReset = () => {
        alert('Starting controlled hard reset:\n\n1. Backup your project\n2. Run: rm -rf .next/ build/ out/ dist/ node_modules/ package-lock.json\n3. Run: npm install\n4. Reset configuration files\n5. Verify core files exist');
    };

    const testDeployment = () => {
        alert('Test your deployment:\n\n1. Run: npm run build\n2. Test locally with: npx serve out/ -p 3000\n3. Visit http://localhost:3000\n4. If working, deploy with: firebase deploy --only hosting');
    };
  
    return (
        <div className="container-reset">
        <header>
            <h1>Next.js Firebase Hard Reset Guide</h1>
            <p className="subtitle">Complete diagnostic and reset process without affecting your deployment</p>
        </header>

        <div className="content">
            <div className="critical">
                <h3>Before You Begin: Backup Your Project</h3>
                <p>Create a backup of your current project to ensure you can restore if needed:</p>
                <div className="terminal">
                    <div className="command"># Create a backup of your project</div>
                    <div className="output">cp -r your-project your-project-backup-$(date +%Y%m%d)</div>
                </div>
            </div>

            <div className="section diagnostic">
                <h2>Comprehensive Diagnostic Process</h2>
                
                <div className="step">
                    <h3><span className="step-number">1</span>Environment Verification</h3>
                    <p>Check your current environment and versions:</p>
                    <div className="terminal">
                        <div className="command"># Check Node.js version</div>
                        <div className="output">node --version</div>
                        <div className="command"># Check npm version</div>
                        <div className="output">npm --version</div>
                        <div className="command"># Check Firebase CLI version</div>
                        <div className="output">firebase --version</div>
                        <div className="command"># Check Next.js version</div>
                        <div className="output">npm list next</div>
                    </div>
                </div>

                <div className="step">
                    <h3><span className="step-number">2</span>Project Structure Analysis</h3>
                    <p>Check your current project structure:</p>
                    <div className="terminal">
                        <div className="command"># Check project structure</div>
                        <div className="output">find . -name "*.json" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" | grep -E "(firebase|next|package|config|page|app)" | head -20</div>
                        <div className="command"># Check if pages/app directory exists</div>
                        <div className="output">ls -la pages/ 2&gt;/dev/null || ls -la src/app/ 2&gt;/dev/null || echo "No pages or app directory found"</div>
                    </div>
                </div>

                <div className="step">
                    <h3><span className="step-number">3</span>Configuration File Check</h3>
                    <p>Review your configuration files:</p>
                    <div className="terminal">
                        <div className="command"># Check firebase.json</div>
                        <div className="output">cat firebase.json 2&gt;/dev/null || echo "No firebase.json found"</div>
                        <div className="command"># Check next.config.js</div>
                        <div className="output">cat next.config.js 2&gt;/dev/null || echo "No next.config.js found"</div>
                        <div className="command"># Check package.json scripts</div>
                        <div className="output">cat package.json | grep -A 10 '"scripts"'</div>
                    </div>
                </div>
            </div>

            <div className="section warning">
                <h2>Controlled Hard Reset Process</h2>
                
                <div className="step">
                    <h3><span className="step-number">1</span>Clean Build Artifacts</h3>
                    <p>Remove build artifacts without affecting your source code:</p>
                    <div className="terminal">
                        <div className="command"># Remove build artifacts</div>
                        <div className="output">rm -rf .next/ build/ out/ dist/</div>
                        <div className="command"># Clean npm cache</div>
                        <div className="output">npm cache clean --force</div>
                    </div>
                </div>

                <div className="step">
                    <h3><span className="step-number">2</span>Fresh Dependency Installation</h3>
                    <p>Reinstall dependencies from scratch:</p>
                    <div className="terminal">
                        <div className="command"># Remove node_modules</div>
                        <div className="output">rm -rf node_modules/ package-lock.json</div>
                        <div className="command"># Reinstall dependencies</div>
                        <div className="output">npm install</div>
                    </div>
                </div>

                <div className="step">
                    <h3><span className="step-number">3</span>Configuration Reset</h3>
                    <p>Reset configuration files to known working states:</p>
                    
                    <div className="tab">
                        <button className="tablinks" onClick={(e) => openTab(e, 'FirebaseConfig')}>firebase.json</button>
                        <button className="tablinks" onClick={(e) => openTab(e, 'NextConfig')}>next.config.js</button>
                        <button className="tablinks" onClick={(e) => openTab(e, 'PackageConfig')}>package.json</button>
                    </div>
                    
                    <div id="FirebaseConfig" className="tabcontent" style={{ display: 'none' }}>
                        <pre>{`{
  "hosting": {
    "source": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}`}</pre>
                    </div>
                    
                    <div id="NextConfig" className="tabcontent" style={{ display: 'none' }}>
                        <pre>{`/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig`}</pre>
                    </div>
                    
                    <div id="PackageConfig" className="tabcontent" style={{ display: 'none' }}>
                        <pre>{`{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next export",
    "predeploy": "npm run build && npm run export",
    "deploy": "firebase deploy --only hosting"
  }
}`}</pre>
                    </div>
                </div>

                <div className="step">
                    <h3><span className="step-number">4</span>Verify Core Files Exist</h3>
                    <p>Ensure these critical files exist in your project:</p>
                    <div className="terminal">
                        <div className="command"># Check for page.tsx or index.js</div>
                        <div className="output">find . -name "page.tsx" -o -name "index.js" | grep -E "(app|pages)" | head -5</div>
                        <div className="command"># Create page.tsx if missing (App Router)</div>
                        <div className="output">{`mkdir -p src/app && cat > src/app/page.tsx << 'EOF'
export default function Home() {
  return (
    <div>
      <h1>Welcome to Next.js</h1>
      <p>This is the home page</p>
    </div>
  )
}
EOF`}</div>
                    </div>
                </div>
            </div>

            <div className="section solution">
                <h2>Build and Test Process</h2>
                
                <div className="step">
                    <h3><span className="step-number">1</span>Build the Application</h3>
                    <p>Test the build process locally:</p>
                    <div className="terminal">
                        <div className="command"># Build the application</div>
                        <div className="output">npm run build</div>
                        <div className="command"># Check build output</div>
                        <div className="output">ls -la .next/ 2&gt;/dev/null || ls -la out/ 2&gt;/dev/null || echo "No build output found"</div>
                    </div>
                </div>

                <div className="step">
                    <h3><span className="step-number">2</span>Test Locally</h3>
                    <p>Test the application locally before deploying:</p>
                    <div className="terminal">
                        <div className="command"># Start development server</div>
                        <div className="output">npm run dev</div>
                        <div className="command"># Or serve production build</div>
                        <div className="output">npx serve@latest out/ -p 3000</div>
                    </div>
                    <p>Visit http://localhost:3000 to verify your application works correctly.</p>
                </div>

                <div className="step">
                    <h3><span className="step-number">3</span>Deploy to Firebase</h3>
                    <p>Once local testing is successful, deploy to Firebase:</p>
                    <div className="terminal">
                        <div className="command"># Deploy to Firebase</div>
                        <div className="output">firebase deploy --only hosting</div>
                    </div>
                </div>

                <div className="step">
                    <h3><span className="step-number">4</span>Verify Deployment</h3>
                    <p>Check your deployment in the Firebase console:</p>
                    <ol>
                        <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
                        <li>Select your project</li>
                        <li>Go to Hosting in the left menu</li>
                        <li>Check the deployment history for any errors</li>
                        <li>Visit your live URL to verify it's working</li>
                    </ol>
                </div>
            </div>

            <div className="note">
                <h3>Next Steps if Issues Persist</h3>
                <p>If you're still experiencing issues after this reset:</p>
                <ul>
                    <li>Check the browser console for JavaScript errors</li>
                    <li>Verify your custom domain configuration in Firebase</li>
                    <li>Check for any redirect or rewrite rules in firebase.json</li>
                    <li>Test with a simpler page to isolate the issue</li>
                </ul>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button className="button" onClick={runDiagnostics}>Run Diagnostics</button>
                <button className="button button-warning" onClick={startReset}>Start Hard Reset</button>
                <button className="button button-success" onClick={testDeployment}>Test Deployment</button>
            </div>
        </div>

        <footer>
            <p>Next.js Firebase Hard Reset Guide | Comprehensive diagnostic and reset process</p>
        </footer>
    </div>
    );
}
