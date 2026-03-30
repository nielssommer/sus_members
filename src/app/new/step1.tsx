import Registration from '@/models/registration.model';
import React, { useEffect } from 'react';

export default function Step1({ registration, setRegistration } : { registration: Registration, setRegistration: (registration: Registration) => void }) {



    return (
        <>
            <h3><strong>Herzlich Willkommen beim S.u.S. Volmarstein 12 / 26 e.V.</strong></h3>
<p>Wir freuen uns euch/Sie als neue Mitglieder in der Fu&szlig;ball-Jugendabteilung begr&uuml;&szlig;en zu d&uuml;rfen.</p>
<p>Diese allgemeinen Hinweise zur Neuaufnahme dienen der Erstinformation zu den folgenden Anmeldeunterlagen.</p>
<p>Bitte f&uuml;llen Sie die folgenden Seiten vollst&auml;ndig aus und unterschreiben Sie diese zum Schluss elektronisch.</p>
<p>Mit Abgabe der Anmeldeunterlagen ist Ihr(e) Sohn/Tochter offiziell als Mitglied der Fu&szlig;ball-Jugendabteilung des S.u.S. Volmarstein 12 / 26 e.V. angemeldet und somit auch bei Sport- und Wegeunf&auml;llen &uuml;ber die Deutsche Sporthilfe e.V. unfallversichert. Ab diesem Zeitpunkt ist auch die Teilnahme an den Trainingseinheiten m&ouml;glich.</p>
<p>Sollte Ihr(e) Sohn/Tochter nach einigen Trainingseinheiten feststellen, doch kein Interesse am Fu&szlig;ballsport zu haben, k&ouml;nnen Sie Ihren Antrag auf Erteilung einer Spielberechtigung jederzeit (bis zum erfolgten ersten Pflichtspiel) wieder zur&uuml;ckziehen. Diese Regelung gilt jedoch nur f&uuml;r Juniorenspieler, die noch nie im Besitz eines offiziellen Spielerpasses gewesen sind; f&uuml;r alle anderen Juniorenspieler gelten die offiziellen Wechselbestimmungen des Westdeutschen Fu&szlig;ballverbandes (WDFV).</p>
<p>Wenn Ihr(e) Sohn/Tochter zus&auml;tzlich auch am Spielbetrieb teilnehmen m&ouml;chte, m&uuml;ssen Sie als Erziehungsberechtigte den Antrag auf Erteilung einer Spielberechtigung stellen (Punkt 7 der Anmeldung) und diesen eigenh&auml;ndig unterschreiben. Sofern Ihr(e) Sohn/Tochter bereits schreiben kann, sollte der Antrag auch mit deren eigenh&auml;ndigen Unterschrift versehen werden.</p>
<p>&nbsp;</p>
<p>Der Jahresbeitrag betr&auml;gt derzeit <strong>96,00 Euro</strong> (Geschwisterkind 48,00 Euro) + <strong>10,00 Euro</strong> (einmalig) Aufnahme- und Bearbeitungsgeb&uuml;hr. Es muss jeweils ein separater Aufnahmeantrag gestellt werden.</p>
<p>Die Mitgliedsbeitr&auml;ge f&uuml;r Ihren Sohn / Ihre Tochter k&ouml;nnen ggf. vom Jobcenter bzw. den Sozialleistungstr&auml;gern nach dem Gesetz zum Bildungs- und Teilhabepaket &uuml;bernommen werden (Antrag f&uuml;r die &Uuml;bernahme des Mitgliedsbeitrages und der Bearbeitungsgeb&uuml;hr bitte an den Kassierer der Jugendabteilung weiterleiten).</p>
        </>
    );
}