'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, ConfigProvider, Form, Input, Typography, message } from 'antd';
import styles from './page.module.css';
import Link from 'next/link';

const { Title, Paragraph } = Typography;
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  // Wenn schon ein Access Token existiert, direkt in den Mitgliederbereich
  useEffect(() => {
  (async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        window.location.replace('/member');
      } else {
        localStorage.removeItem('accessToken'); // stale Token säubern
      }
    } catch {
      localStorage.removeItem('accessToken');
    }
  })();
}, []);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // wichtig für httpOnly Refresh-Cookie
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Login fehlgeschlagen');
      }
      const { accessToken } = await res.json();
      if (!accessToken) throw new Error('Kein Access Token erhalten.');
      localStorage.setItem('accessToken', accessToken);
      message.success('Erfolgreich angemeldet.');
      window.location.assign('/member');
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#033B84',
          colorInfo: '#033B84',
          borderRadius: 12,
        },
      }}
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <img src="/Logo.jpg" alt="S.u.S. Volmarstein 12/26 e.V. Logo" className={styles.logo} />
          <h1 className={styles.brand}>S.u.S. Volmarstein 12/26 e.V.</h1>
        </header>

        <main className={styles.main}>
          <Card className={styles.card}>
            <Title level={2} style={{ marginTop: 0 }}>Anmeldung</Title>
            <Paragraph className={styles.subtitle}>
              Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an, um den Mitgliederbereich zu nutzen.
            </Paragraph>

            <Alert
              type="info"
              showIcon
              message="Hinweis"
              description="Bei der Anmeldung wird ein sicherer Refresh-Cookie gesetzt. Der Zugriff auf Ihre Daten erfolgt ausschließlich verschlüsselt."
              style={{ marginBottom: 16 }}
            />

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="E-Mail"
                name="email"
                rules={[{ required: true, message: 'Bitte E-Mail eingeben' }, { type: 'email', message: 'Bitte gültige E-Mail eingeben' }]}
              >
                <Input placeholder="name@example.com" />
              </Form.Item>
              <Form.Item
                label="Passwort"
                name="password"
                rules={[{ required: true, message: 'Bitte Passwort eingeben' }]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Anmelden
              </Button>

              <div style={{marginTop: 16}}>
                <Link href="/register">Neu registrieren</Link>
              </div>
            </Form>
          </Card>
        </main>

        <footer className={styles.footer}>
          <span>© S.u.S. Volmarstein 12/26 e.V.</span>
        </footer>
      </div>
    </ConfigProvider>
  );
}
