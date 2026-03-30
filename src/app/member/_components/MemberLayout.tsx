'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Menu, ConfigProvider, Spin } from 'antd';
import { FileSearchOutlined, TeamOutlined, MessageOutlined, NotificationOutlined, ProfileOutlined, CommentOutlined, InboxOutlined, GlobalOutlined, LogoutOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';

const { Header, Sider, Content, Footer } = Layout;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type MemberLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
};

export default function MemberLayout({ children, title, subtitle, extra }: MemberLayoutProps) {
  const pathname = usePathname();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const at = localStorage.getItem('accessToken');
        if (!at) return (window.location.href = '/login');
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${at}` },
          credentials: 'include',
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMe(data);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ display:'grid', placeItems:'center', minHeight:'60vh' }}><Spin/></div>;

  const roles: string[] = me?.roles ?? [];
  const isGF = roles.includes('GESCHAEFTSFUEHRER');
  const isJV = roles.includes('JUGENDVORSTAND');
  const isTrainer = roles.includes('TRAINER');
  const isWebmaster = roles.includes('WEBMASTER');

  const items = [
    { key: '/member', label: 'Übersicht', icon: <ProfileOutlined /> },
    ...(isGF ? [{ key: '/member/registrations', label: 'Registrierungen', icon: <FileSearchOutlined /> }] : []),
    ...(isJV ? [{ key: '/member/teams', label: 'Mannschaften', icon: <TeamOutlined /> }] : []),
    ...((isJV || isTrainer) ? [{ key: '/member/polls', label: 'Abstimmungen', icon: <MessageOutlined /> }] : []),
    ...[{ key: '/member/calendar', label: 'Kalendar', icon: <InboxOutlined /> }],
    ...((isJV || isWebmaster) ? [{ key: '/member/announcements', label: 'Neuigkeiten', icon: <NotificationOutlined /> }] : []),
    ...(isWebmaster ? [{ key: '/member/homepage', label: 'Homepage', icon: <GlobalOutlined /> }] : []),
    ...(isTrainer ? [{ key: '/member/team-content', label: 'Mein Team', icon: <TeamOutlined /> }] : []),
    ...[{ key: '/member/discussions', label: 'Diskussionen', icon: <CommentOutlined /> }],
    ...((isGF || isTrainer) ? [{ key: '/member/requests', label: 'Benutzeranträge', icon: <FileSearchOutlined /> }] : []),
    ...(isGF ? [{ key: '/member/users', label: 'Nutzer', icon: <ProfileOutlined /> }] : []),
  ];

  const logoutItem = [{ key: '__logout__', label: 'Abmelden', icon: <LogoutOutlined />, danger: true }];

  const handleMenuClick = async (key: string) => {
    if (key === '__logout__') {
      try {
        const at = localStorage.getItem('accessToken');
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: at ? { Authorization: `Bearer ${at}` } : {},
          credentials: 'include',
        });
      } catch {
        // Frontend-Logout muss auch bei Netzwerkfehlern funktionieren.
      } finally {
        localStorage.removeItem('accessToken');
        window.location.href = '/';
      }
      return;
    }

    window.location.href = key;
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#033B84', borderRadius: 10 } }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#033B84', color: '#fff', display:'flex', alignItems:'center', gap:12 }}>
          <img src="/Logo.jpg" alt="Logo" style={{ height: 36 }} />
          <div style={{ fontWeight: 700 }}>Mitgliederbereich</div>
        </Header>
        <Layout>
          <Sider breakpoint="lg" collapsedWidth={0}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[pathname]}
                onClick={({ key }) => handleMenuClick(String(key))}
                items={items}
                style={{ flex: 1, minHeight: 0 }}
              />
              <Menu
                theme="dark"
                mode="inline"
                selectable={false}
                onClick={({ key }) => handleMenuClick(String(key))}
                items={logoutItem}
              />
            </div>
          </Sider>
          <Layout>
            <Content style={{ margin: 16 }}>
              {(title || subtitle || extra) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div>
                    {title ? <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{title}</div> : null}
                    {subtitle ? <div style={{ color: '#666', marginTop: 4 }}>{subtitle}</div> : null}
                  </div>
                  <div>{extra}</div>
                </div>
              )}
              {children}
            </Content>
            <Footer style={{ textAlign: 'center' }}>© S.u.S. Volmarstein 12/26 e.V.</Footer>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
