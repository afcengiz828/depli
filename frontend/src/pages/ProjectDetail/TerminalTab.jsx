import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function TerminalTab({ projectId }) {
    const [serviceName, setServiceName] = useState('backend');
    const [started, setStarted] = useState(false);
    const [entries, setEntries] = useState([]); // { type: 'output' | 'command', text }
    const [input, setInput] = useState('');
    const socketRef = useRef(null);
    const boxRef = useRef(null);

    const connect = () => {
        const token = localStorage.getItem('accessToken');
        const socket = io(`${import.meta.env.VITE_API_URL}/terminal`, { auth: { token } });

        socket.on('connect', () => {
            socket.emit('subscribe', { projectId, serviceName });
            setStarted(true);
        });

        socket.on('output', (chunk) => setEntries((prev) => [...prev, { type: 'output', text: chunk }]));
        socket.on('error', (err) => setEntries((prev) => [...prev, { type: 'output', text: `\n[ERROR] ${err.message}\n` }]));
        socket.on('disconnect', () => setStarted(false));

        socketRef.current = socket;
    };

    useEffect(() => {
        return () => socketRef.current?.disconnect();
    }, []);

    useEffect(() => {
        boxRef.current?.scrollTo(0, boxRef.current.scrollHeight);
    }, [entries]);

    const sendInput = (e) => {
        e.preventDefault();
        if (!socketRef.current) return;
        setEntries((prev) => [...prev, { type: 'command', text: input }]);
        socketRef.current.emit('input', { data: input + '\n' });
        setInput('');
    };

    return (
        <div className="terminal-tab">
        {!started ? (
            <div className="terminal-setup">
            <label>Servis Adı</label>
            <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="backend" />
            <button className="btn btn-primary" onClick={connect}>Terminal Bağlantısı Kur</button>
            </div>
        ) : (
            <>
            <pre className="terminal-box" ref={boxRef}>
            {entries.map((entry, i) =>
                entry.type === 'command' ? (
                    <div key={i} className="terminal-command-line">
                    <span className="terminal-prompt">$</span> {entry.text}
                    </div>
                ) : (
                    <span key={i}>{entry.text}</span>
                )
            )}
            </pre>
            <form className="terminal-input" onSubmit={sendInput}>
            <span className="terminal-prompt">$</span>
            <input value={input} onChange={(e) => setInput(e.target.value)} autoFocus />
            <button type="submit" className="btn btn-primary">Gönder</button>
            </form>
            </>
        )}
        </div>
    );
}
