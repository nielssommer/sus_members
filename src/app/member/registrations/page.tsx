'use client';

import React, { useEffect, useState } from 'react';
import { Card, Checkbox, Input, Table, Tag } from 'antd';
import MemberLayout from '../_components/MemberLayout';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function RegistrationsList() {
  const [data, setData] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [showDone, setShowDone] = useState(false);

  const load = async () => {
    const at = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE}/admin/registrations?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${at}` },
    });
    setData(await res.json());
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filteredData = showDone
    ? data
    : data.filter((r) => String(r?.status).toUpperCase() !== 'DONE');

  return (
    <MemberLayout>
      <Card title="Registrierungen">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <Input.Search placeholder="Name/E-Mail" value={q} onChange={e=>setQ(e.target.value)} onSearch={load} style={{ maxWidth: 360 }} />
          <Checkbox checked={showDone} onChange={(e) => setShowDone(e.target.checked)}>
            Fertige Registrierungen anzeigen
          </Checkbox>
        </div>
        <Table
          rowKey={(r) => r._id}
          dataSource={filteredData}
          columns={[
            { title: 'Name', dataIndex: 'lastName', render: (_:any, r:any) => `${r.firstName} ${r.lastName}` },
            { title: 'Geburtsdatum', dataIndex: 'birthDate', render: (v:string)=> new Date(v).toLocaleDateString() },
            {
              title: 'Typ',
              render: (_: any, r: any) =>
                r?.paper?.originalUploadedAt
                  ? <Tag color="gold">Papieranmeldung</Tag>
                  : <Tag>Online</Tag>,
            },
            { title: 'Status', dataIndex: 'status', render: (s:string)=> <Tag>{s}</Tag> },
            { title: 'Aktion', render: (_:any, r:any)=> <a href={`/member/registrations/${r._id}`}>Details</a> },
          ]}
        />
      </Card>
    </MemberLayout>
  );
}
