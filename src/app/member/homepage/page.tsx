'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Divider, Form, Input, List, Modal, Popconfirm, Space, Switch, Typography, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import MemberLayout from '../_components/MemberLayout';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const { Text } = Typography;

export default function HomepageAdminPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);

  const [contentForm] = Form.useForm();
  const [partnerForm] = Form.useForm();
  const [editPartnerForm] = Form.useForm();
  const [downloadForm] = Form.useForm();

  const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null);
  const [editPartnerLogoFile, setEditPartnerLogoFile] = useState<File | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  const [editPartner, setEditPartner] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/homepage/admin`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Homepage-Daten konnten nicht geladen werden');
      const json = await res.json();
      setData(json);
      contentForm.setFieldsValue({
        slogan: json.slogan || '',
        subtitle: json.subtitle || '',
        privacyPolicy: json.legal?.privacyPolicy || '',
        codeOfHonor: json.legal?.codeOfHonor || '',
        statute: json.legal?.statute || '',
        imprint: json.legal?.imprint || '',
      });
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveContent = async (values: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/homepage/admin/content`, {
        method: 'PATCH',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      message.success('Homepage-Inhalte gespeichert');
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const addPartner = async (values: any) => {
    try {
      const fd = new FormData();
      fd.append('name', values.name);
      fd.append('website', values.website || '');
      if (partnerLogoFile) fd.append('logo', partnerLogoFile);
      const res = await fetch(`${API}/homepage/admin/partners`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error('Partner konnte nicht angelegt werden');
      message.success('Partner angelegt');
      partnerForm.resetFields();
      setPartnerLogoFile(null);
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Anlegen');
    }
  };

  const openEditPartner = (p: any) => {
    setEditPartner(p);
    setEditPartnerLogoFile(null);
    editPartnerForm.setFieldsValue({ name: p.name, website: p.website || '', removeLogo: false });
  };

  const savePartner = async (values: any) => {
    if (!editPartner?._id) return;
    try {
      const fd = new FormData();
      fd.append('name', values.name || '');
      fd.append('website', values.website || '');
      if (values.removeLogo) fd.append('removeLogo', '1');
      if (editPartnerLogoFile) fd.append('logo', editPartnerLogoFile);
      const res = await fetch(`${API}/homepage/admin/partners/${editPartner._id}`, {
        method: 'PATCH',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error('Partner konnte nicht geändert werden');
      message.success('Partner gespeichert');
      setEditPartner(null);
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Speichern');
    }
  };

  const removePartner = async (id: string) => {
    try {
      const res = await fetch(`${API}/homepage/admin/partners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Partner konnte nicht gelöscht werden');
      message.success('Partner gelöscht');
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Löschen');
    }
  };

  const addDownload = async (values: any) => {
    if (!downloadFile) return message.error('Bitte Datei auswählen');
    try {
      const fd = new FormData();
      fd.append('name', values.name);
      fd.append('file', downloadFile);
      const res = await fetch(`${API}/homepage/admin/downloads`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error('Download konnte nicht angelegt werden');
      message.success('Download hinzugefügt');
      downloadForm.resetFields();
      setDownloadFile(null);
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Hinzufügen');
    }
  };

  const removeDownload = async (id: string) => {
    try {
      const res = await fetch(`${API}/homepage/admin/downloads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Download konnte nicht gelöscht werden');
      message.success('Download gelöscht');
      await load();
    } catch (e: any) {
      message.error(e?.message ?? 'Fehler beim Löschen');
    }
  };

  return (
    <MemberLayout title="Homepage" subtitle="Inhalte der öffentlichen Homepage verwalten">
      <Card title="Slogan, Untertitel und Rechtstexte" loading={loading}>
        <Form form={contentForm} layout="vertical" onFinish={saveContent}>
          <Form.Item name="slogan" label="Slogan" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label="Untertitel" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Divider />
          <Form.Item name="privacyPolicy" label="Datenschutz">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="codeOfHonor" label="Ehrenkodex">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="statute" label="Satzung">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="imprint" label="Impressum">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Speichern</Button>
        </Form>
      </Card>

      <Card title="Partner & Unterstützer" style={{ marginTop: 16 }} loading={loading}>
        <Form form={partnerForm} layout="vertical" onFinish={addPartner}>
          <Space align="start" wrap>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="website" label="Homepage">
              <Input style={{ width: 320 }} placeholder="https://..." />
            </Form.Item>
            <Form.Item label="Logo">
              <Upload
                beforeUpload={(file) => { setPartnerLogoFile(file as File); return false; }}
                maxCount={1}
                onRemove={() => { setPartnerLogoFile(null); }}
              >
                <Button icon={<UploadOutlined />}>Logo wählen</Button>
              </Upload>
            </Form.Item>
          </Space>
          <Button type="primary" htmlType="submit">Partner hinzufügen</Button>
        </Form>

        <Divider />

        <List
          dataSource={data?.partners || []}
          locale={{ emptyText: 'Keine Partner hinterlegt' }}
          renderItem={(p: any) => (
            <List.Item
              actions={[
                <Button key="edit" onClick={() => openEditPartner(p)}>Bearbeiten</Button>,
                <Popconfirm key="delete" title="Partner löschen?" onConfirm={() => removePartner(p._id)}>
                  <Button danger>Löschen</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={p.logoUrl ? <img src={`${API}${p.logoUrl}`} alt={p.name} style={{ width: 48, height: 48, objectFit: 'contain', border: '1px solid #eee', borderRadius: 6 }} /> : null}
                title={p.name}
                description={p.website ? <a href={p.website} target="_blank" rel="noreferrer">{p.website}</a> : <Text type="secondary">Keine Homepage</Text>}
              />
            </List.Item>
          )}
        />
      </Card>

      <Card title="Downloads" style={{ marginTop: 16 }} loading={loading}>
        <Form form={downloadForm} layout="vertical" onFinish={addDownload}>
          <Space align="start" wrap>
            <Form.Item name="name" label="Bezeichnung" rules={[{ required: true }]}>
              <Input style={{ width: 320 }} />
            </Form.Item>
            <Form.Item label="Datei" required>
              <Upload
                beforeUpload={(file) => { setDownloadFile(file as File); return false; }}
                maxCount={1}
                onRemove={() => { setDownloadFile(null); }}
              >
                <Button icon={<UploadOutlined />}>Datei wählen</Button>
              </Upload>
            </Form.Item>
          </Space>
          <Button type="primary" htmlType="submit">Download hinzufügen</Button>
        </Form>

        <Divider />

        <List
          dataSource={data?.downloads || []}
          locale={{ emptyText: 'Keine Downloads hinterlegt' }}
          renderItem={(d: any) => (
            <List.Item
              actions={[
                <a key="open" href={`${API}${d.url}`} target="_blank" rel="noreferrer">Öffnen</a>,
                <Popconfirm key="delete" title="Download löschen?" onConfirm={() => removeDownload(d._id)}>
                  <Button danger>Löschen</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={d.name}
                description={`${d.filename || 'Datei'}${d.size ? ` · ${Number(d.size).toLocaleString()} Bytes` : ''}`}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        open={!!editPartner}
        title="Partner bearbeiten"
        onCancel={() => setEditPartner(null)}
        onOk={() => editPartnerForm.submit()}
        okText="Speichern"
      >
        <Form form={editPartnerForm} layout="vertical" onFinish={savePartner}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="website" label="Homepage">
            <Input />
          </Form.Item>
          <Form.Item name="removeLogo" label="Logo entfernen" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Neues Logo">
            <Upload
              beforeUpload={(file) => { setEditPartnerLogoFile(file as File); return false; }}
              maxCount={1}
              onRemove={() => { setEditPartnerLogoFile(null); }}
            >
              <Button icon={<UploadOutlined />}>Neues Logo wählen</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </MemberLayout>
  );
}
