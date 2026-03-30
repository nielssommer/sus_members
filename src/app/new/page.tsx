'use client';

import { Button, Card, ConfigProvider, Flex, Steps, Typography } from "antd";
import React, { useRef } from "react";
import styles from "./page.module.css";

import Step1 from "./step1";
import Step2, { Step2Handle } from "./step2";
import Step3, { Step3Handle } from "./step3";
import Step4, { Step4Handle } from "./step4";
import Step5, { Step5Handle } from "./step5";
import Step6, { Step6Handle } from "./step6";
import Step7, { Step7Handle } from "./step7";
import Finish from "./finish";
import Registration from "@/models/registration.model";

const { Title } = Typography;

export default function NewMemberView() {
  const [registration, setRegistration] = React.useState<Registration>(new Registration());
  const [currentHeader, setCurrentHeader] = React.useState('Neue Mitgliedschaft');
  const [currentStep, setCurrentStep] = React.useState(0);

  // Refs zu den Steps, die Validierung anbieten
  const step2Ref = useRef<Step2Handle>(null);
  const step3Ref = React.useRef<Step3Handle>(null);
  const step4Ref = React.useRef<Step4Handle>(null);
  const step5Ref = React.useRef<Step5Handle>(null);
  const step6Ref = React.useRef<Step6Handle>(null);
  const step7Ref = React.useRef<Step7Handle>(null);

  const handleNext = async () => {
    let ok = true;
    switch (currentStep) {
      case 1: ok = await (step2Ref.current?.validate?.() ?? true); break;
      case 2: ok = await (step3Ref.current?.validate?.() ?? true); break;
      case 3: ok = await (step4Ref.current?.validate?.() ?? true); break;
      case 4: ok = await (step5Ref.current?.validate?.() ?? true); break;
      case 5: ok = await (step6Ref.current?.validate?.() ?? true); break;
      case 6: ok = await (step7Ref.current?.validate?.() ?? true); break;
      default: ok = true;
    }
    if (!ok) return;
    setCurrentStep(prev => Math.min(prev + 1, 7));
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#033B84',
          colorInfo: '#033B84',
          colorLink: '#033B84',
          colorLinkHover: '#4871A3',
          borderRadius: 10,
        },
      }}
    >
      <div className={styles.page}>
        {/* Dunkler Header mit Logo (identisch zur Upload-Seite) */}
        <header className={styles.header}>
          <img src="/Logo.jpg" alt="S.u.S. Volmarstein 12/26 e.V. Logo" className={styles.logo} />
          <h1 className={styles.brand}>S.u.S. Volmarstein 12/26 e.V.</h1>
        </header>

        <main className={styles.main}>
          <div className={styles.contentWrap}>
            <Title level={2} className={styles.title}>Neue Anmeldung</Title>

            <div className={styles.stepsWrap}>
              <Steps
                current={currentStep}
                items={[
                  { title: 'Allgemeines' },
                  { title: 'Persönliche Daten' },
                  { title: 'Ehrenkodex' },
                  { title: 'Datenschutz' },
                  { title: 'Aufsichtspflicht' },
                  { title: 'Gesundheit' },
                  { title: 'Spielberechtigung' },
                ]}
              />
            </div>

            <Card className={styles.card} title={currentHeader}>
              {currentStep === 0 && <Step1 registration={registration} setRegistration={setRegistration} /> }
              {currentStep === 1 && <Step2 ref={step2Ref} registration={registration} setRegistration={setRegistration} /> }
              {currentStep === 2 && <Step3 ref={step3Ref} registration={registration} setRegistration={setRegistration} /> }
              {currentStep === 3 && <Step4 ref={step4Ref} registration={registration} setRegistration={setRegistration} /> }
              {currentStep === 4 && <Step5 ref={step5Ref} registration={registration} setRegistration={setRegistration} /> }
              {currentStep === 5 && <Step6 ref={step6Ref} registration={registration} setRegistration={setRegistration} /> }
              {currentStep === 6 && <Step7 ref={step7Ref} registration={registration} setRegistration={setRegistration} /> }
              {currentStep === 7 && <Finish registration={registration} setRegistration={setRegistration} /> }
            </Card>

            <Flex className={styles.actions} gap={10}>
              <Button type="primary" onClick={handleNext} disabled={currentStep >= 7}>
                {currentStep < 7 ? 'Weiter' : 'Abschließen'}
              </Button>
              <Button
                onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
                disabled={currentStep <= 0}
              >
                Zurück
              </Button>
            </Flex>
          </div>
        </main>

        <footer className={styles.footer}>
          <span>© S.u.S. Volmarstein 12/26 e.V.</span>
        </footer>
      </div>
    </ConfigProvider>
  );
}
