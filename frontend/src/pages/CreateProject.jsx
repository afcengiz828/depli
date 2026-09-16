import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const BACKENDS = ['nodejs', 'python', 'php', 'java', 'go'];
const FRONTENDS = ['react', 'vue', 'angular', 'svelte', 'nextjs'];
const DATABASES = ['postgresql', 'mysql', 'mongodb', 'redis'];

// Backend'deki tech-stack.config.ts ile birebir aynı tutulmalı
const VERSION_OPTIONS = {
    nodejs: ['20.5.0', '18.18.0'],
    python: ['3.12.0', '3.11.8'],
    php: ['8.2.12', '8.1.22'],
    java: ['21', '20'],
    go: ['1.23', '1.22'],
    react: ['18.2.0', '17.0.2'],
    vue: ['3.2.47', '2.7.14'],
    angular: ['15.2.0', '14.2.0'],
    svelte: ['4.1.4', '3.59.1'],
    nextjs: ['13.4.12', '12.3.4'],
    postgresql: ['16', '15'],
    mysql: ['8.0', '5.7'],
    mongodb: ['6.0', '5.0'],
    redis: ['7.0', '6.2'],
};
export default function CreateProject() {
    const [name, setName] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [githubToken, setGithubToken] = useState('');
    const [backend, setBackend] = useState('nodejs');
    const [backendVersion, setBackendVersion] = useState(VERSION_OPTIONS.nodejs[0]);
    const [frontend, setFrontend] = useState('react');
    const [frontendVersion, setFrontendVersion] = useState(VERSION_OPTIONS.react[0]);
    const [database, setDatabase] = useState('postgresql');
    const [databaseVersion, setDatabaseVersion] = useState(VERSION_OPTIONS.postgresql[0]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Teknoloji değiştiğinde, o teknolojinin ilk (varsayılan) versiyonuna geç
    const handleBackendChange = (value) => {
        setBackend(value);
        setBackendVersion(VERSION_OPTIONS[value][0]);
    };
    const handleFrontendChange = (value) => {
        setFrontend(value);
        setFrontendVersion(VERSION_OPTIONS[value][0]);
    };
    const handleDatabaseChange = (value) => {
        setDatabase(value);
        setDatabaseVersion(VERSION_OPTIONS[value][0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await client.post('/projects', {
                name,
                githubUrl,
                githubToken: githubToken || undefined,
                techStack: {
                    backend,
                    backendVersion,
                    frontend,
                    frontendVersion,
                    database,
                    databaseVersion,
                },
            });
            navigate(`/projects/${res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Proje oluşturulamadı');
        }
    };

    return (
        <div className="page page-narrow">
        <h1>Yeni Proje</h1>
        <form className="form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <label>Proje Adı</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>GitHub Repo URL</label>
        <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/kullanici/repo" required />

        <label>GitHub Token (private repo için, opsiyonel)</label>
        <input value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />

        <div className="form-row">
        <div>
        <label>Backend</label>
        <select value={backend} onChange={(e) => handleBackendChange(e.target.value)}>
        {BACKENDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        </div>
        <div>
        <label>Backend Versiyonu</label>
        <select value={backendVersion} onChange={(e) => setBackendVersion(e.target.value)}>
        {VERSION_OPTIONS[backend].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        </div>
        </div>

        <div className="form-row">
        <div>
        <label>Frontend</label>
        <select value={frontend} onChange={(e) => handleFrontendChange(e.target.value)}>
        {FRONTENDS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        </div>
        <div>
        <label>Frontend Versiyonu</label>
        <select value={frontendVersion} onChange={(e) => setFrontendVersion(e.target.value)}>
        {VERSION_OPTIONS[frontend].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        </div>
        </div>

        <div className="form-row">
        <div>
        <label>Database</label>
        <select value={database} onChange={(e) => handleDatabaseChange(e.target.value)}>
        {DATABASES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        </div>
        <div>
        <label>Database Versiyonu</label>
        <select value={databaseVersion} onChange={(e) => setDatabaseVersion(e.target.value)}>
        {VERSION_OPTIONS[database].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        </div>
        </div>

        <button type="submit" className="btn btn-primary">Projeyi Oluştur</button>
        </form>
        </div>
    );
}
