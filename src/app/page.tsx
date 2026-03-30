'use client';

import React from 'react';
import Image from 'next/image';
import { Button, Card, ConfigProvider, Flex, Steps, Typography, Row, Col, Tag } from 'antd';
import {
  SignatureOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  TeamOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Paragraph } = Typography;

export default function Home() {
  const go = (href: string) => typeof window !== 'undefined' && (window.location.href = href);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#033B84',       // Vereinsblau (aus Logo)
          colorInfo: '#033B84',
          colorLink: '#033B84',
          colorLinkHover: '#4871A3',
          borderRadius: 12,
        },
      }}
    >
      <div className={styles.page}>
        {/* Header wie auf den anderen Seiten */}
        <header className={styles.header}>
          <img src="/Logo.jpg" alt="S.u.S. Volmarstein 12/26 e.V. Logo" className={styles.logo} />
          <h1 className={styles.brand}>S.u.S. Volmarstein 12/26 e.V.</h1>
        </header>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <Title className={styles.heroTitle}>Mitgliederservice</Title>
              <Paragraph className={styles.heroSubtitle}>
                Schnell und digital:
                <br /> Neue Mitgliedschaft, Status prüfen & Mitglieder-Login.
              </Paragraph>
              <Flex gap={12} wrap className={styles.ctaGroup}>
                <Button
                  type="primary"
                  size="large"
                  shape="round"
                  icon={<SignatureOutlined />}
                  onClick={() => go('/new')}
                >
                  Neue Mitgliedschaft
                </Button>
                <Button  
                  size="large"
                  shape="round"
                  icon={<FilePdfOutlined />}
                  onClick={() => go('/new/paper')}
                >
                  Papier-Anmeldung hochladen
                </Button>
                <Button
                  size="large"
                  shape="round"
                  icon={<InfoCircleOutlined />}
                  onClick={() => go('/status')}
                >
                  Status prüfen
                </Button>
                <Button
                  size="large"
                  shape="round"
                  icon={<LoginOutlined />}
                  onClick={() => go('/login')}
                >
                  Mitglieder-Login
                </Button>
              </Flex>
              <div className={styles.heroBadges}>
                <Tag color="blue" className={styles.badge}>Sicher & DSGVO-konform</Tag>
                <Tag color="blue" className={styles.badge}>Schneller Upload & Prüfung</Tag>
              </div>
            </div>

            <div className={styles.heroCardWrap}>
              <Card className={styles.heroCard} bordered={false}>
                <Title level={4} style={{ marginTop: 0 }}>So funktioniert’s</Title>
                <Steps
                  current={0}
                  items={[
                    { title: 'Daten ausfüllen', icon: <FileTextOutlined /> },
                    { title: 'E-Mail bestätigen', icon: <SafetyCertificateOutlined /> },
                    { title: 'Unterlagen hochladen', icon: <TeamOutlined /> },
                  ]}
                />
              </Card>
            </div>
          </div>
        </section>

        {/* Aktionen als Kacheln */}
        <main className={styles.main}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card className={styles.actionCard} hoverable onClick={() => go('/new')}>
                <SignatureOutlined className={styles.actionIcon} />
                <Title level={4}>Neue Mitgliedschaft</Title>
                <Paragraph type="secondary">
                  Online anmelden, E-Mail bestätigen und Unterlagen digital hochladen.
                </Paragraph>
                <Button type="primary" shape="round">Jetzt starten</Button>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card className={styles.actionCard} hoverable onClick={() => go('/new')}>
                <SignatureOutlined className={styles.actionIcon} />
                <Title level={4}>Papier-Anmeldung hochladen</Title>
                <Paragraph type="secondary">
                  Du hast das Formular handschriftlich? Lade das <strong>ausgefüllte PDF</strong> hoch –
                  unsere KI liest die Daten automatisch aus und legt eine Registrierung an.
                </Paragraph>
                <Button type="primary" shape="round">PDF hochladen</Button>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card className={styles.actionCard} hoverable onClick={() => go('/status')}>
                <InfoCircleOutlined className={styles.actionIcon} />
                <Title level={4}>Status-Anmeldung</Title>
                <Paragraph type="secondary">
                  Bearbeitungsstand Ihrer Anmeldung einsehen – transparent & aktuell.
                </Paragraph>
                <Button shape="round">Status prüfen</Button>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card className={styles.actionCard} hoverable onClick={() => go('/login')}>
                <LoginOutlined className={styles.actionIcon} />
                <Title level={4}>Anmeldung Mitgliederbereich</Title>
                <Paragraph type="secondary">
                  Interner Bereich für Vereinsmitglieder: Verwaltung, Abstimmungen und Kommunikation.
                </Paragraph>
                <Button shape="round">Zum Login</Button>
              </Card>
            </Col>
          </Row>
        </main>

        <footer className={styles.footer}>
          <span>© S.u.S. Volmarstein 12/26 e.V.</span>
        </footer>
      </div>
    </ConfigProvider>
  );
}
