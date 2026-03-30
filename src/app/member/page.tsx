'use client';

import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Tag } from 'antd';
import MemberLayout from './_components/MemberLayout';
const { Title, Paragraph } = Typography;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function MemberHome() {
  const [news, setNews] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const at = localStorage.getItem('accessToken');
        const [n, p] = await Promise.all([
          fetch(`${API_BASE}/announcements/active`, { headers: { Authorization: `Bearer ${at}` } }).then(r=>r.json()),
          fetch(`${API_BASE}/polls`, { headers: { Authorization: `Bearer ${at}` } }).then(r=>r.json()),
        ]);
        setNews(n || []);
        setPolls((p || []).filter((x: any) => !x.closed).slice(0,3));
      } catch {}
    })();
  }, []);

  return (
    <MemberLayout>
      <Card>
        <Title level={3} style={{ marginTop: 0 }}>Willkommen</Title>
        <Paragraph>Hier finden Sie Neuigkeiten des Vereins und offene Abstimmungen.</Paragraph>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
        <Card title="Neuigkeiten">
          <List
            dataSource={news}
            renderItem={(item:any) => (
              <List.Item>
                <List.Item.Meta title={item.title} description={item.body} />
              </List.Item>
            )}
          />
        </Card>
        <Card title="Offene Abstimmungen">
          <List
            dataSource={polls}
            renderItem={(p:any) => (
              <List.Item actions={[<a key="vote" href={`/member/polls`}>Ansehen</a>]}>
                <List.Item.Meta title={p.question} description={`${p.options?.length ?? 0} Optionen`} />
                {p.closed ? <Tag color="default">geschlossen</Tag> : <Tag color="blue">offen</Tag>}
              </List.Item>
            )}
          />
        </Card>
      </div>
    </MemberLayout>
  );
}
