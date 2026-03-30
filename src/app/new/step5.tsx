'use client';

import Registration from '@/models/registration.model';
import { Checkbox, Form, Typography } from 'antd';
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';

type Props = {
  registration: Registration;
  setRegistration: (registration: Registration) => void;
};

export type Step5Handle = {
  validate: () => Promise<boolean>;
};

const { Paragraph, Text } = Typography;

function getAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

const Step5 = forwardRef<Step5Handle, Props>(function Step5({ registration, setRegistration }, ref) {
  const [form] = Form.useForm();

  // Exponierte Methode für Parent
  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        await form.validateFields();
        return true;
      } catch (err: any) {
        const first = err?.errorFields?.[0];
        if (first?.name) {
          // @ts-ignore string|string[]
          form.scrollToField(first.name, { block: 'center' });
        }
        return false;
      }
    },
  }));

  // Initial aus Parent übernehmen
  useEffect(() => {
    form.setFieldsValue({
      // neuer, sprechender Feldname im Formular:
      supervisionConsent: (registration as any).checkDutyOfSupervision ?? false,
    });
  }, [registration, form]);

  // Formularänderungen -> Parent-State
  const onValuesChange = (_: any, allValues: { supervisionConsent?: boolean }) => {
    setRegistration({
      ...registration,
      // Wert im Parent unter gleichem Namen speichern
      // (falls ihr einen anderen Feldnamen bevorzugt, sag kurz Bescheid)
      checkDutyOfSupervision: !!allValues.supervisionConsent,
    });
  };

  const age = getAge((registration as any).birthDate);
  const isMinor = age !== null && age < 18;

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Paragraph><Text strong>Hinweise zur Aufsichtspflicht</Text></Paragraph>

      <Paragraph>
        1. Fußball ist ein Wettkampfsport, bei dem im Kampf um den Ball körperliche Schäden auftreten können.
        Die Teilnahme an Training und Spiel geschieht auf eigene Gefahr.
      </Paragraph>
      <Paragraph>
        2. Es stehen nicht immer in jedem Training mehrere Trainer/Übungsleiter zur Verfügung, sondern mitunter auch nur
        ein Trainer/Übungsleiter. Auch Trainer/Übungsleiter ohne Lizenz können ein Training leiten.
      </Paragraph>
      <Paragraph>
        3. Der Trainer/Übungsleiter kann die Spieler/Spielerinnen insbesondere während der Umkleidezeiten nur in
        beschränktem Umfang beaufsichtigen. Es können insbesondere nicht alle Spieler/Spielerinnen gleichzeitig im Blick
        und unter Kontrolle gehalten werden. Der Trainer/Übungsleiter darf die Spieler/Spielerinnen alleine z. B. auf die
        Toilette oder in die Trinkpause entlassen.
      </Paragraph>
      <Paragraph>
        4. Zur Versorgung eines Einzelnen darf der Trainer/Übungsleiter seine Aufsichtspflicht in Notfällen gegenüber den
        anderen trainierenden Spielern/Spielerinnen zurückstellen und/oder diese gegebenenfalls auch vorzeitig nach Hause schicken.
      </Paragraph>
      <Paragraph>
        5. Es besteht die Möglichkeit, dass die Spieler/Spielerinnen z. B. nach dem Gang auf die Toilette eigenmächtig
        nicht mehr auf den Sportplatz zurückkehren und vom Trainer/Übungsleiter unbemerkt auf die Straße gelangen.
      </Paragraph>
      <Paragraph>
        6. Ich/Wir muss/müssen mich/uns vergewissern, dass zu Beginn einer Übungsstunde ein Trainer/Übungsleiter anwesend ist,
        der die Aufsichtspflicht über die Spieler/Spielerinnen im oben geregelten Umfang übernimmt. Nach Ende der Übungsstunde
        endet diese Aufsichtspflicht für den Trainer/Übungsleiter.
      </Paragraph>

      <Form.Item
        name="supervisionConsent"
        valuePropName="checked"
        rules={[
          {
            // Pflicht nur bei Minderjährigen
            validator: (_, v) =>
              isMinor ? (v ? Promise.resolve() : Promise.reject('Bitte die Hinweise zur Aufsichtspflicht bestätigen.'))
                      : Promise.resolve(),
          },
        ]}
      >
        <Checkbox>
          Ich, der Erziehungsberechtigte meines Kindes, bin mir o. g. Hinweisen bewusst und entbinde den Trainer/Übungsleiter
          in den o. g. Fällen von seiner Aufsichtspflicht.
        </Checkbox>
      </Form.Item>
    </Form>
  );
});

export default Step5;
