'use client';

import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, List, Popconfirm, Switch, Space, Tag, message } from 'antd';
import MemberLayout from '../_components/MemberLayout';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form] = Form.useForm();
  const at = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const [roles, setRoles] = useState<string[]>([]);
  const isWebmaster = roles.includes('WEBMASTER');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${at}` } });
        if (!res.ok) return;
        const me = await res.json();
        setRoles(Array.isArray(me?.roles) ? me.roles : []);
      } catch {}
    })();
  }, [at]);

  const load = async () => {
    const res = await fetch(`${API_BASE}/announcements`, { headers: { Authorization: `Bearer ${at}` } });
    setItems(await res.json());
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  const create = async (v:any) => {
    const res = await fetch(`${API_BASE}/announcements`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${at}`}, body: JSON.stringify({ title: v.title, body: v.body, showOnHomepage: !!v.showOnHomepage }) });
    if (res.ok) { message.success('Neuigkeit erstellt'); form.resetFields(); load(); }
  };

  const toggle = async (id:string, active:boolean) => {
    await fetch(`${API_BASE}/announcements/${id}/active`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${at}`}, body: JSON.stringify({ active }) });
    load();
  };

  const toggleHomepage = async (id: string, showOnHomepage: boolean) => {
    await fetch(`${API_BASE}/announcements/${id}/homepage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${at}` },
      body: JSON.stringify({ showOnHomepage }),
    });
    load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${at}` },
    });
    if (res.ok) {
      message.success('Neuigkeit gelöscht');
      load();
    } else {
      message.error('Löschen fehlgeschlagen');
    }
  };

  return (
    <MemberLayout>
      <Card title="Neuigkeit erstellen">
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="title" label="Titel" rules={[{required:true}]}><Input/></Form.Item>
          <Form.Item name="body" label="Inhalt" rules={[{required:true}]}><Input.TextArea rows={4}/></Form.Item>
          {isWebmaster ? (
            <Form.Item name="showOnHomepage" label="Auf Homepage anzeigen" valuePropName="checked">
              <Switch />
            </Form.Item>
          ) : null}
          <Button type="primary" htmlType="submit">Veröffentlichen</Button>
        </Form>
      </Card>

      <Card title="Neuigkeiten verwalten" style={{ marginTop: 16 }}>
        <List
          dataSource={items}
          renderItem={(i:any)=>(
            <List.Item
              actions={[
                <Space key="actions">
                  <span>Aktiv</span>
                  <Switch checked={i.active} onChange={(v)=>toggle(i._id, v)} />
                  {isWebmaster ? (
                    <>
                      <span>Homepage</span>
                      <Switch checked={!!i.showOnHomepage} onChange={(v)=>toggleHomepage(i._id, v)} />
                    </>
                  ) : null}
                  <Popconfirm
                    title="Neuigkeit löschen?"
                    description="Dieser Vorgang kann nicht rückgängig gemacht werden."
                    okText="Löschen"
                    cancelText="Abbrechen"
                    onConfirm={() => remove(i._id)}
                  >
                    <Button danger size="small">Löschen</Button>
                  </Popconfirm>
                </Space>,
              ]}
            >
              <List.Item.Meta
                title={<Space>{i.title} {i.showOnHomepage ? <Tag color="blue">Homepage</Tag> : null}</Space>}
                description={i.body}
              />
            </List.Item>
          )}
        />
      </Card>
    </MemberLayout>
  );
}
