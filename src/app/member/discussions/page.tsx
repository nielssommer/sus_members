// app/member/discussions/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, List, Space, Tag, Typography, message } from 'antd';
import Link from 'next/link';
import MemberLayout from '../_components/MemberLayout';

const { Text } = Typography;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function readRolesFromToken(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = token.split('.')[1];
    if (!payload) return [];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return Array.isArray(decoded?.roles) ? decoded.roles : [];
  } catch {
    return [];
  }
}

type Discussion = {
  _id: string;
  title: string;
  body: string;
  visibility: 'INTERNAL'|'ALL';
  status: 'OPEN'|'CLOSED';
  updatedAt: string;
};

export default function DiscussionsPage() {
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/discussions`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Laden fehlgeschlagen');
        setItems(await res.json());
      } catch (e:any) {
        message.error(e?.message ?? 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canCreate = useMemo(() => {
    const roles = readRolesFromToken(token);
    return roles.includes('TRAINER') || roles.includes('JUGENDVORSTAND') || roles.includes('GESCHAEFTSFUEHRER');
  }, [token]);

  return (
    <MemberLayout>
      <Card
        title="Diskussionen"
        extra={canCreate ? <Link href="/member/discussions/new"><Button type="primary">Neue Diskussion</Button></Link> : null}
      >
        <List
          loading={loading}
          locale={{ emptyText: <Empty description="Keine Diskussionen" /> }}
          dataSource={items}
          renderItem={(d) => (
            <List.Item actions={[<Link key="open" href={`/member/discussions/${d._id}`}>Öffnen</Link>]}>
              <List.Item.Meta
                title={<Link href={`/member/discussions/${d._id}`}>{d.title}</Link>}
                description={
                  <Space>
                    <Tag color={d.status === 'OPEN' ? 'green' : 'default'}>{d.status}</Tag>
                    <Tag>{d.visibility === 'ALL' ? 'Öffentlich' : 'Intern'}</Tag>
                    <Text type="secondary">{new Date(d.updatedAt).toLocaleString()}</Text>
                  </Space>
                }
              />
              <div style={{ maxWidth: 600, color: '#666' }}>
                {d.body.length > 180 ? `${d.body.slice(0, 180)}…` : d.body}
              </div>
            </List.Item>
          )}
        />
      </Card>
    </MemberLayout>
  );
}
