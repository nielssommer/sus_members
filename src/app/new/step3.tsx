'use client';

import Registration from '@/models/registration.model';
import { Checkbox, Form, Typography } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';

type Props = {
  registration: Registration;
  setRegistration: (registration: Registration) => void;
};

export type Step3Handle = {
  validate: () => Promise<boolean>;
};

const { Paragraph, Text } = Typography;

const Step3 = forwardRef<Step3Handle, Props>(function Step3({ registration, setRegistration }, ref) {
  const [form] = Form.useForm();

  // Exponierte Methode für den Parent (NewMemberView)
  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        await form.validateFields();
        return true;
      } catch (err: any) {
        const first = err?.errorFields?.[0];
        if (first?.name) {
          // @ts-ignore: AntD akzeptiert string|string[]
          form.scrollToField(first.name, { block: 'center' });
        }
        return false;
      }
    },
  }));

  // Initiale Werte aus dem Parent-State ins Formular spiegeln
  useEffect(() => {
    // akzeptiert sowohl evtl. bereits vorhandenes 'checkCodeOfHonor' als auch das Feld mit Tippfehler
    const current =
      // @ts-ignore – falls Typ das Feld (noch) nicht kennt
      (registration as any).checkCodeOfHonor ??
      // @ts-ignore
      (registration as any).checkCoodeOfHonor ??
      false;

    form.setFieldsValue({ checkCodeOfHonor: current });
  }, [registration, form]);

  // Änderungen aus dem Formular -> Parent-State spiegeln
  const onValuesChange = (_: any, allValues: { checkCodeOfHonor?: boolean }) => {
    const checked = !!allValues.checkCodeOfHonor;
    setRegistration({
      ...registration,
      // Beibehaltung des existierenden Feldnamens im State:
      // @ts-ignore – Feld ist im Typ evtl. nicht deklariert
      checkCoodeOfHonor: checked,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
      initialValues={{ checkCodeOfHonor: false }}
    >
      <Paragraph>
        Der Verein fördert die Funktion des Sports als verbindendes Element zwischen Nationalitäten,
        Kulturen, Religionen und sozialen Schichten. Er bietet Kindern, Jugendlichen und Erwachsenen
        unabhängig von Geschlecht, Hautfarbe, Herkunft, Glauben, sozialer Stellung oder sexueller
        Identität eine sportliche Heimat.
      </Paragraph>
      <Paragraph>
        <Text strong>Der Verein bietet nur solchen Personen eine Mitgliedschaft an, die sich zu den Grundsätzen bekennen.</Text>
      </Paragraph>

      <Paragraph>
        <Text strong>Verlust der Mitgliedschaft</Text>
      </Paragraph>
      <Paragraph>
        Der Vorstand kann Maßnahmen gegen ein Mitglied einleiten, wenn es eine mit dem Ehrenkodex
        unvereinbare Gesinnung offenbart.
      </Paragraph>

      <Form.Item
        name="checkCodeOfHonor"
        valuePropName="checked"
        rules={[
          {
            validator: (_, v) =>
              v ? Promise.resolve() : Promise.reject('Bitte den Ehrenkodex bestätigen.'),
          },
        ]}
      >
        <Checkbox>
          Ich erkenne den Ehrenkodex sowie die Satzungen und Ordnungen des Vereins in der jeweils
          gültigen Fassung an.
        </Checkbox>
      </Form.Item>
    </Form>
  );
});

export default Step3;
