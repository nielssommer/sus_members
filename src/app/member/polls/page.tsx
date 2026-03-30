'use client';

import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, List, Progress, Radio, Select, Space, Tag, Typography, message } from 'antd';
import MemberLayout from '../_components/MemberLayout';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const { Text } = Typography;

function getUserIdFromAccessToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json?.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
}

function getRolesFromAccessToken(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = token.split('.')[1];
    if (!payload) return [];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return Array.isArray(json?.roles) ? json.roles : [];
  } catch {
    return [];
  }
}

function summarizePoll(poll: any, userId: string | null) {
  const votes = Array.isArray(poll?.votes) ? poll.votes : [];
  const options = Array.isArray(poll?.options) ? poll.options : [];
  const totalVotes = votes.length;
  const myVote = userId ? votes.find((v: any) => String(v?.userId) === userId) : null;

  const rows = options.map((option: any) => {
    const count = votes.filter((v: any) => v?.optionId === option.id).length;
    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return {
      id: option.id,
      text: option.text,
      count,
      percent,
      mine: myVote?.optionId === option.id,
    };
  });

  return { totalVotes, myVoteOptionId: myVote?.optionId as string | undefined, rows };
}

export default function PollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [form] = Form.useForm();
  const at = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const userId = getUserIdFromAccessToken(at);
  const tokenRoles = getRolesFromAccessToken(at);
  const isTrainerOnly = tokenRoles.includes('TRAINER') && !tokenRoles.includes('JUGENDVORSTAND') && !tokenRoles.includes('GESCHAEFTSFUEHRER');
  const canCreate = tokenRoles.includes('TRAINER') || tokenRoles.includes('JUGENDVORSTAND') || tokenRoles.includes('GESCHAEFTSFUEHRER');
  const canModerate = tokenRoles.includes('JUGENDVORSTAND') || tokenRoles.includes('GESCHAEFTSFUEHRER');

  const load = async () => {
    const [pollRes, teamRes, meRes] = await Promise.all([
      fetch(`${API_BASE}/polls`, { headers: { Authorization: `Bearer ${at}` }, credentials: 'include' }),
      fetch(`${API_BASE}/teams/mine`, { headers: { Authorization: `Bearer ${at}` }, credentials: 'include' }),
      fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${at}` }, credentials: 'include' }),
    ]);
    setPolls(await pollRes.json());
    const mine = await teamRes.json().catch(() => []);
    setTeams(Array.isArray(mine) ? mine : []);
    const me = await meRes.json().catch(() => ({}));
    const r = Array.isArray(me?.roles) ? me.roles : [];
    if (r.includes('TRAINER') && !r.includes('JUGENDVORSTAND') && !r.includes('GESCHAEFTSFUEHRER') && Array.isArray(mine) && mine.length === 1) {
      form.setFieldValue('teamId', mine[0]._id);
    }
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  const create = async (v:any) => {
    const options = (v.options as string).split('\n').map(s=>s.trim()).filter(Boolean);
    const res = await fetch(`${API_BASE}/polls`, {
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${at}`},
      credentials: 'include',
      body: JSON.stringify({ question: v.question, options, teamId: v.teamId || undefined }),
    });
    if (res.ok) { message.success('Abstimmung erstellt'); form.resetFields(); load(); }
    else message.error(await res.text());
  };

  const vote = async (id:string, optionId:string) => {
    const res = await fetch(`${API_BASE}/polls/${id}/vote`, {
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${at}`},
      credentials: 'include',
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) { message.success('Stimme gezählt'); load(); }
  };

  return (
    <MemberLayout>
      {canCreate && (
        <Card title="Abstimmung erstellen">
          <Form form={form} layout="vertical" onFinish={create}>
            <Form.Item label="Frage" name="question" rules={[{required:true}]}><Input /></Form.Item>
            <Form.Item label="Optionen (je Zeile eine)" name="options" rules={[{required:true}]}><Input.TextArea rows={4}/></Form.Item>
            <Form.Item
              label="Mannschaft (optional)"
              name="teamId"
              rules={isTrainerOnly && teams.length > 1 ? [{ required: true, message: 'Bitte Mannschaft auswählen' }] : []}
            >
              <Select
                allowClear={!isTrainerOnly}
                disabled={isTrainerOnly && teams.length === 1}
                placeholder={isTrainerOnly && teams.length > 1 ? 'Mannschaft auswählen (Pflicht)' : 'Mannschaft auswählen'}
                options={teams.map((t: any) => ({ value: t._id, label: `${t.name} (${t.ageGroup}-Jugend)` }))}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit">Erstellen</Button>
          </Form>
        </Card>
      )}

      <Card title="Abstimmungen" style={{ marginTop: 16 }}>
        <List
          dataSource={polls}
          renderItem={(p:any)=>(
            (() => {
              const result = summarizePoll(p, userId);
              return (
                <List.Item
                  actions={p.closed || (!canModerate && String(p.createdBy) !== String(userId))
                    ? []
                    : [<Button key="close" onClick={async()=>{
                        await fetch(`${API_BASE}/polls/${p._id}/close`, {
                          method:'PATCH',
                          headers:{ Authorization:`Bearer ${at}` },
                          credentials: 'include',
                        });
                        load();
                      }}>Schließen</Button>]}
                >
                  <div style={{ width: '100%' }}>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{p.question}</span>
                          {p.closed ? <Tag color="default">geschlossen</Tag> : <Tag color="green">offen</Tag>}
                          {p.teamId ? <Tag color="blue">Teamumfrage</Tag> : null}
                        </Space>
                      }
                      description={`${result.totalVotes} Stimmen`}
                    />

                    {!p.closed && (
                      <Radio.Group
                        style={{ marginBottom: 12 }}
                        value={result.myVoteOptionId}
                        onChange={e=>vote(p._id, e.target.value)}
                      >
                        {result.rows.map((row:any)=> (
                          <Radio key={row.id} value={row.id} style={{ display:'block' }}>
                            {row.text}
                          </Radio>
                        ))}
                      </Radio.Group>
                    )}

                    <Space direction="vertical" style={{ width: '100%' }} size={6}>
                      {result.rows.map((row:any) => (
                        <div key={row.id}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text>{row.text}</Text>
                            <Text type="secondary">
                              {row.count} ({row.percent}%){row.mine ? ' · Deine Stimme' : ''}
                            </Text>
                          </Space>
                          <Progress
                            percent={row.percent}
                            showInfo={false}
                            strokeColor={row.mine ? '#1677ff' : undefined}
                            size="small"
                          />
                        </div>
                      ))}
                    </Space>
                  </div>
                </List.Item>
              );
            })()
          )}
        />
      </Card>
    </MemberLayout>
  );
}
