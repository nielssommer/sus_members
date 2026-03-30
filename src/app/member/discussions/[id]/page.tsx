// app/member/discussions/[id]/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Input, List, Space, Tag, Typography, message } from 'antd';
import MemberLayout from '../../_components/MemberLayout';
import { useParams } from 'next/navigation';
const { Title, Text, Paragraph } = Typography;
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

function readSubFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return typeof decoded?.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

export default function DiscussionDetail() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const roles = useMemo(() => readRolesFromToken(token), [token]);
  const myUserId = useMemo(() => readSubFromToken(token), [token]);

  const fetchD = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/discussions/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Laden fehlgeschlagen');
      setD(await res.json());
    } catch (e:any) {
      message.error(e?.message ?? 'Fehler beim Laden');
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchD(); }, [id]);

  const canComment = useMemo(() => {
    if (!d) return false;
    if (d.status === 'CLOSED') return false;
    if (d.visibility === 'ALL') return true;
    return roles.includes('TRAINER') || roles.includes('JUGENDVORSTAND') || roles.includes('GESCHAEFTSFUEHRER');
  }, [d, roles]);
  const hasOrgRole = useMemo(
    () => roles.includes('TRAINER') || roles.includes('JUGENDVORSTAND') || roles.includes('GESCHAEFTSFUEHRER'),
    [roles],
  );

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/discussions/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
        body: JSON.stringify({ message: comment }),
      });
      if (!res.ok) throw new Error('Kommentar fehlgeschlagen');
      setComment('');
      await fetchD();
    } catch (e:any) {
      message.error(e?.message ?? 'Fehler beim Kommentieren');
    }
  };

  if (loading) return <MemberLayout><Card>lädt …</Card></MemberLayout>;
  if (!d) return <MemberLayout><Card><Empty description="Nicht gefunden" /></Card></MemberLayout>;

  return (
    <MemberLayout>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>{d.title}</Title>
            <Tag color={d.status === 'OPEN' ? 'green' : 'default'}>{d.status}</Tag>
            <Tag>{d.visibility === 'ALL' ? 'Öffentlich' : 'Intern'}</Tag>
          </Space>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{d.body}</Paragraph>

          <Card size="small">
            <Space wrap>
              <Text type="secondary">Debug:</Text>
              <Tag color="blue">Rollen: {roles.length ? roles.join(', ') : 'keine erkannt'}</Tag>
              <Tag>Visibility: {d.visibility}</Tag>
              <Tag>Status: {d.status}</Tag>
              <Tag color={hasOrgRole ? 'green' : 'default'}>Org-Rolle: {hasOrgRole ? 'ja' : 'nein'}</Tag>
              <Tag color={canComment ? 'green' : 'red'}>Kommentar: {canComment ? 'erlaubt' : 'nicht erlaubt'}</Tag>
            </Space>
          </Card>

          <div>
            <Title level={5}>Kommentare</Title>
            <List
              dataSource={d.comments ?? []}
              locale={{ emptyText: 'Noch keine Kommentare' }}
              renderItem={(c: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space size={8}>
                        <Text strong>{c.authorName ?? 'Unbekannt'}</Text>
                        {myUserId && c.authorId === myUserId ? <Tag color="blue">du</Tag> : null}
                        <Text type="secondary">{new Date(c.createdAt ?? d.updatedAt).toLocaleString()}</Text>
                      </Space>
                    }
                    description={c.message}
                  />
                </List.Item>
              )}
            />
          </div>

          {canComment && (
            <Space.Compact style={{ width: '100%' }}>
              <Input.TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Kommentar hinzufügen…"
                autoSize={{ minRows: 2, maxRows: 5 }}
              />
              <Button type="primary" onClick={addComment} disabled={!comment.trim()}>Senden</Button>
            </Space.Compact>
          )}
          {!canComment && (
            <Text type="secondary">
              {d.status === 'CLOSED'
                ? 'Diese Diskussion ist geschlossen. Kommentare sind nicht mehr möglich.'
                : 'Für diese interne Diskussion fehlen die nötigen Rollenrechte.'}
            </Text>
          )}
        </Space>
      </Card>
    </MemberLayout>
  );
}
