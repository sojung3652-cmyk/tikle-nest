import { cookies } from "next/headers";

export type Lang = "en" | "ko";

export const AUTH_STRINGS = {
  en: {
    back: "← Back",
    signin_title: "Sign in",
    signup_title: "Create account",
    name_label: "Your name",
    name_placeholder: "e.g. Kim",
    email_label: "Email",
    password_label: "Password",
    remember_me: "Remember me",
    submit_signin: "Sign in",
    submit_signup: "Create account",
    no_account: "Don't have an account?",
    have_account: "Already have an account?",
    signup_link: "Sign up",
    signin_link: "Sign in",
    create_household: "Create household",
    join_household: "Join household",
    household_name_label: "Household name",
    household_name_ph: "e.g. Kim Family",
    currency_label: "Currency",
    invite_code_label: "Invite code",
    invite_code_ph: "ABC123",
    submit_create: "Create household",
    submit_join: "Join household",
    partner_hint: "Name your household. Your partner can join using the invite code — find it anytime in Account settings.",
    join_hint: "Enter the 6-letter invite code from your partner's household.",
    tikle_nest: "Tikle Nest",
  },
  ko: {
    back: "← 뒤로",
    signin_title: "로그인",
    signup_title: "회원가입",
    name_label: "이름",
    name_placeholder: "예: 김지수",
    email_label: "이메일",
    password_label: "비밀번호",
    remember_me: "로그인 유지",
    submit_signin: "로그인",
    submit_signup: "회원가입",
    no_account: "계정이 없으신가요?",
    have_account: "이미 계정이 있으신가요?",
    signup_link: "회원가입",
    signin_link: "로그인",
    create_household: "가계 만들기",
    join_household: "가계 참여하기",
    household_name_label: "가계 이름",
    household_name_ph: "예: 김씨 가계",
    currency_label: "통화",
    invite_code_label: "초대 코드",
    invite_code_ph: "ABC123",
    submit_create: "가계 만들기",
    submit_join: "참여하기",
    partner_hint: "가계 이름을 정하세요. 파트너는 초대 코드로 참여할 수 있습니다 — 언제든 설정에서 확인할 수 있습니다.",
    join_hint: "파트너 가계의 6자리 초대 코드를 입력하세요.",
    tikle_nest: "Tikle Nest",
  },
} as const;

export type AuthStrings = typeof AUTH_STRINGS.en;

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies();
  return cookieStore.get("tn-lang")?.value === "ko" ? "ko" : "en";
}
