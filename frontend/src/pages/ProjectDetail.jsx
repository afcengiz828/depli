import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';
import OverviewTab from './ProjectDetail/OverviewTab';
import EnvTab from './ProjectDetail/EnvTab';
import LogsTab from './ProjectDetail/LogsTab';
import TerminalTab from './ProjectDetail/TerminalTab';

const TABS = ['overview', 'env', 'logs', 'terminal'];

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tab, setTab] = useState('overview');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchProject = () => {
        client.get(`/projects/${id}`).then((res) => setProject(res.data));
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

    const runAction = async (action) => {
        setActionLoading(true);
        try {
            if (action === 'start') await client.post(`/projects/${id}/start`);
            if (action === 'stop') await client.post(`/projects/${id}/stop`);
            if (action === 'remove') await client.delete(`/projects/${id}/container`);
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız');
        } finally {
            fetchProject();
            setActionLoading(false);
        }
    };

    const deleteProject = async () => {
        if (!window.confirm('Bu projeyi kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.')) {
            return;
        }
        setActionLoading(true);
        try {
            await client.delete(`/projects/${id}`);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.message || 'Proje silinemedi');
        } finally {
            setActionLoading(false);
        }
    };

    if (!project) return <div className="page">Yükleniyor...</div>;

    return (
        <div className="page">
        <div className="page-header">
        <div>
        <h1>{project.name}</h1>
        <StatusBadge status={project.status} />
        </div>
        <div className="action-buttons">
        <button className="btn btn-success" disabled={actionLoading} onClick={() => runAction('start')}>Başlat</button>
        <button className="btn btn-secondary" disabled={actionLoading} onClick={() => runAction('stop')}>Durdur</button>
        <button className="btn btn-danger" disabled={actionLoading} onClick={() => runAction('remove')}>Konteynırı Kaldır</button>
        <button className="btn btn-danger" disabled={actionLoading} onClick={deleteProject}>Projeyi Sil</button>
        </div>
        </div>

        <div className="tabs">
        {TABS.map((t) => (
            <button key={t} className={`tab ${tab === t ? 'tab-active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' && 'Genel Bakış'}
            {t === 'env' && 'Env Variables'}
            {t === 'logs' && 'Loglar'}
            {t === 'terminal' && 'Terminal'}
            </button>
        ))}
        </div>

        <div className="tab-content">
        {tab === 'overview' && <OverviewTab project={project} />}
        {tab === 'env' && <EnvTab projectId={id} />}
        {tab === 'logs' && <LogsTab projectId={id} />}
        {tab === 'terminal' && <TerminalTab projectId={id} />}
        </div>
        </div>
    );
}
