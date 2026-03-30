'use client';

import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Select, Button, Table, message, Popconfirm, Space, Tag } from 'antd';
import MemberLayout from '../_components/MemberLayout';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const AGE = [
    { value: 'A', label: 'A-Jugend' },
    { value: 'B', label: 'B-Jugend' },
    { value: 'C', label: 'C-Jugend' },
    { value: 'D', label: 'D-Jugend' },
    { value: 'E', label: 'E-Jugend' },
    { value: 'F', label: 'F-Jugend' },
    { value: 'G', label: 'G-Jugend' },
  ];

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const at = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const load = async () => {
    const [t, u] = await Promise.all([
      fetch(`${API_BASE}/teams`, { headers: { Authorization: `Bearer ${at}` } }).then(r=>r.json()),
      fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${at}` } }).then(r=>r.json()),
    ]);
    const teamRows = Array.isArray(t) ? t : [];
    setTeams(teamRows);
    setUsers(u.users);
    if (selectedTeam?._id) {
      const fresh = teamRows.find((x: any) => x._id === selectedTeam._id) ?? null;
      setSelectedTeam(fresh);
    }
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  const create = async (v:any) => {
    const res = await fetch(`${API_BASE}/teams`, {
      method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${at}`}, body: JSON.stringify(v)
    });
    if (res.ok) { message.success('Team erstellt'); load(); }
  };

  const addCoach = async (userId:string) => {
    if (!selectedTeam?._id) return;
    const res = await fetch(`${API_BASE}/teams/${selectedTeam._id}/coaches/add`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${at}`}, body: JSON.stringify({ userId }) });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Trainer konnte nicht hinzugefügt werden');
    }
    message.success('Trainer hinzugefügt'); load();
  };

  const removeCoach = async (userId: string) => {
    if (!selectedTeam?._id) return;
    const res = await fetch(`${API_BASE}/teams/${selectedTeam._id}/coaches/remove`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${at}` },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Trainer konnte nicht entfernt werden');
    }
    message.success('Trainer entfernt');
    load();
  };

  const removeTeam = async (id: string) => {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${at}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Löschen fehlgeschlagen');
    }
    if (selectedTeam?._id === id) setSelectedTeam(null);
    message.success('Mannschaft gelöscht');
    load();
  };

  return (
    <MemberLayout>
      <Card title="Mannschaften anlegen">
        <Form layout="inline" onFinish={create}>
          <Form.Item name="name" rules={[{required:true}]}><Input placeholder="z. B. U13 D1" /></Form.Item>
          <Form.Item name="ageGroup" rules={[{required:true}]}>
            <Select placeholder="Altersklasse" options={AGE.map(a=>({ value:a.value, label:a.label }))} style={{ minWidth: 180 }}/>
          </Form.Item>
          <Button type="primary" htmlType="submit">Erstellen</Button>
        </Form>
      </Card>

      <Card title="Mannschaften" style={{ marginTop: 16 }}>
        <Table
          rowKey="_id"
          dataSource={teams}
          onRow={(r)=>({ onClick:()=> setSelectedTeam(r) })}
          columns={[
            { title:'Name', dataIndex:'name' },
            { title:'Altersklasse', dataIndex:'ageGroup' },
            {
              title:'Trainer',
              render: (_:any, r:any)=> {
                const coaches = r.coaches || [];
                if (!coaches.length) return <Tag>keine</Tag>;
                return (
                  <Space wrap>
                    {coaches.map((c: any) => (
                      <Tag key={c._id ?? c}>{c.name || c.email || 'Trainer'}</Tag>
                    ))}
                  </Space>
                );
              }
            },
            {
              title: 'Aktionen',
              render: (_: any, r: any) => (
                <Popconfirm
                  title="Mannschaft löschen?"
                  description={`"${r.name}" wird dauerhaft gelöscht.`}
                  okText="Löschen"
                  cancelText="Abbrechen"
                  onConfirm={async () => {
                    try {
                      await removeTeam(r._id);
                    } catch (err: any) {
                      message.error(err?.message ?? 'Löschen fehlgeschlagen');
                    }
                  }}
                >
                  <Button
                    danger
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Löschen
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
        {selectedTeam && (
          <div style={{ marginTop: 12 }}>
            <b>Trainer zuweisen zu {selectedTeam.name}</b>
            <Select
              style={{ minWidth: 260, marginLeft: 8 }}
              showSearch
              placeholder="Benutzer auswählen"
              options={users.map((u:any)=>({ value:u._id, label: `${u.name || u.email}` }))}
              onSelect={addCoach}
            />
            <div style={{ marginTop: 12 }}>
              <b>Zugeordnete Trainer</b>
              <div style={{ marginTop: 8 }}>
                {(selectedTeam.coaches ?? []).length === 0 ? (
                  <Tag>Keine Trainer zugeordnet</Tag>
                ) : (
                  <Space wrap>
                    {(selectedTeam.coaches ?? []).map((coach: any) => (
                      <Tag key={coach._id ?? coach}>
                        <Space size={6}>
                          <span>{coach.name || coach.email || 'Trainer'}</span>
                          <Popconfirm
                            title="Trainer entfernen?"
                            okText="Entfernen"
                            cancelText="Abbrechen"
                            onConfirm={async () => {
                              try {
                                await removeCoach(coach._id ?? coach);
                              } catch (e: any) {
                                message.error(e?.message ?? 'Entfernen fehlgeschlagen');
                              }
                            }}
                          >
                            <Button size="small" danger>Entfernen</Button>
                          </Popconfirm>
                        </Space>
                      </Tag>
                    ))}
                  </Space>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </MemberLayout>
  );
}
