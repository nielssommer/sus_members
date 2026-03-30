import dayjs, { Dayjs } from "dayjs";
import { CheckType, TypeOfApplication } from "./enums.model";

export default class Registration {

    createdAt: Dayjs = dayjs();

    entryDate: Dayjs = dayjs();
    typeOfMembership: string = '';
    gender: string = '';
    firstName: string = '';
    lastName: string = '';
    birthDate: Dayjs = dayjs();
    birthCity: string = '';
    address: string = '';
    email: string = '';
    phone: string = '';
    mobile: string = '';
    checkDisclaimerInjuries: boolean = false;
    bankAccount: BankAccount = new BankAccount();
    checkCoodeOfHonor: boolean = false;
    checkDutyOfSupervision: boolean = false;
    dataProtection: DataProtection = new DataProtection();
    health: Health = new Health();

    emailForVerification: string = '';
    verificationCode: string = '';

    signaturePlayer: string = '';
    signatureAdult: string = '';

}

class BankAccount {
    accoountHolder: string = '';
    bic: string = '';
    bankName: string = '';
    iban: string = '';
    checkSEPA: boolean = false;
}

class DataProtection {
    checkContactPhone: boolean = false;
    checkContactEmail: boolean = false;

    checkPublishHomepage: boolean = false;
    checkPublishFacebook: boolean = false;
    checkPublishInstagram: boolean = false;
    checkPublishNewspaper: boolean = false;
    checkPublishOtherSocialMedia: boolean = false;

    checkDataProtection: boolean = false;

    adultName: string = '';
    checkDataProtectionAdult: boolean = false;

    checkPictureConsent: boolean = false;
    checkPictureConsentFussballDe: boolean = false;
    checkUseOfPlayerPicture: boolean = false;

    checkGameReports: boolean = false;
    checkPlayerProfile: boolean = false;
}

class Health {
    playClassification: string = '';
    checkNoInjuries: boolean = false;
    checkInjuries: boolean = false;
    injuries: string = '';
    checkDrugs: string = '';
    checkHealthClaim: boolean = false;
}

class EligibilityToPlay {

    typeOfApplication: TypeOfApplication = TypeOfApplication.FIRST_ISSUE;
    typeOfCheck: CheckType = CheckType.BIRTH_CERTIFICATE;

    passNo: string = '';
    oldAssociation: string = '';
    oldTeam: string = '';
    exitDate: Dayjs = dayjs();
    existingPenalty: boolean = false;
    activePenalty: boolean = false;

    stateOfOrigin: string = '';
    birthCity: string = '';
    lastCityInForeignCountry: string = '';
    lastCountry: string = '';
    inGermanySince: Dayjs = dayjs();
    firstNameOfFatherAndMother: string = '';

    checkCorrectness: boolean = false;

    reason: string = '';
    lostOfPass: boolean = false;

}

