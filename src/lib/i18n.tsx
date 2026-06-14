import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "az" | "en" | "ru";

const dict = {
  az: {
    appName: "APEX BANK",
    tagline: "Sənin maliyyə partnyorun",
    login: "Daxil ol", signup: "Qeydiyyat", logout: "Çıxış",
    email: "E-poçt", password: "Şifrə", fullName: "Ad Soyad", phone: "Telefon",
    createAccount: "Hesab yarat", haveAccount: "Hesabın var?", noAccount: "Hesabın yoxdur?",
    dashboard: "İdarə paneli", accounts: "Hesablar", cards: "Kartlar",
    transfers: "Köçürmələr", transactions: "Əməliyyatlar", settings: "Tənzimləmələr",
    welcome: "Xoş gəlmisən", totalBalance: "Ümumi balans", recentTx: "Son əməliyyatlar",
    newTransfer: "Yeni köçürmə", openAccount: "Yeni hesab aç", issueCard: "Kart sifariş et",
    accountName: "Hesab adı", currency: "Valyuta", accountType: "Hesab növü",
    current: "Cari", savings: "Əmanət", deposit: "Depozit",
    debit: "Debet", credit: "Kredit", virtual: "Virtual",
    fromAccount: "Hesabdan", toIban: "Alıcı IBAN", recipientName: "Alıcı adı",
    amount: "Məbləğ", description: "Təsvir", send: "Göndər",
    cancel: "Ləğv et", confirm: "Təsdiq et", save: "Saxla",
    language: "Dil", theme: "Mövzu", light: "Açıq", dark: "Qaranlıq",
    cardHolder: "Kart sahibi", cardNumber: "Kart nömrəsi", expiry: "Bitmə",
    block: "Blokla", unblock: "Aç", freeze: "Dondur",
    success: "Uğurlu", error: "Xəta", reference: "Referans",
    noData: "Məlumat yoxdur", search: "Axtar", date: "Tarix",
    balance: "Balans", type: "Növü", status: "Status",
    in: "Daxil olan", out: "Çıxan", pending: "Gözləyir", completed: "Tamamlandı", failed: "Uğursuz",
    profile: "Profil", security: "Təhlükəsizlik",
    insufficientFunds: "Vəsait kifayət deyil", invalidIban: "IBAN düzgün deyil",
    transferDone: "Köçürmə tamamlandı", copied: "Kopyalandı",
    quickActions: "Sürətli əməliyyatlar", notifications: "Bildirişlər",
    showDetails: "Detalları göstər", hideDetails: "Gizlət",
    welcomeBack: "Yenidən xoş gəlmisən",
    landingHero: "Bank xidmətləri yeni səviyyədə",
    landingSub: "Təhlükəsiz, sürətli və ağıllı bank həlləri APEX BANK ilə.",
    getStarted: "Başla",
  },
  en: {
    appName: "APEX BANK",
    tagline: "Your financial partner",
    login: "Sign in", signup: "Sign up", logout: "Sign out",
    email: "Email", password: "Password", fullName: "Full name", phone: "Phone",
    createAccount: "Create account", haveAccount: "Have an account?", noAccount: "No account?",
    dashboard: "Dashboard", accounts: "Accounts", cards: "Cards",
    transfers: "Transfers", transactions: "Transactions", settings: "Settings",
    welcome: "Welcome", totalBalance: "Total balance", recentTx: "Recent transactions",
    newTransfer: "New transfer", openAccount: "Open account", issueCard: "Issue card",
    accountName: "Account name", currency: "Currency", accountType: "Account type",
    current: "Current", savings: "Savings", deposit: "Deposit",
    debit: "Debit", credit: "Credit", virtual: "Virtual",
    fromAccount: "From account", toIban: "Recipient IBAN", recipientName: "Recipient name",
    amount: "Amount", description: "Description", send: "Send",
    cancel: "Cancel", confirm: "Confirm", save: "Save",
    language: "Language", theme: "Theme", light: "Light", dark: "Dark",
    cardHolder: "Card holder", cardNumber: "Card number", expiry: "Expires",
    block: "Block", unblock: "Unblock", freeze: "Freeze",
    success: "Success", error: "Error", reference: "Reference",
    noData: "No data", search: "Search", date: "Date",
    balance: "Balance", type: "Type", status: "Status",
    in: "Incoming", out: "Outgoing", pending: "Pending", completed: "Completed", failed: "Failed",
    profile: "Profile", security: "Security",
    insufficientFunds: "Insufficient funds", invalidIban: "Invalid IBAN",
    transferDone: "Transfer completed", copied: "Copied",
    quickActions: "Quick actions", notifications: "Notifications",
    showDetails: "Show details", hideDetails: "Hide",
    welcomeBack: "Welcome back",
    landingHero: "Banking at a new level",
    landingSub: "Secure, fast and smart banking solutions with APEX BANK.",
    getStarted: "Get started",
  },
  ru: {
    appName: "APEX BANK",
    tagline: "Ваш финансовый партнёр",
    login: "Войти", signup: "Регистрация", logout: "Выйти",
    email: "Эл. почта", password: "Пароль", fullName: "ФИО", phone: "Телефон",
    createAccount: "Создать аккаунт", haveAccount: "Уже есть аккаунт?", noAccount: "Нет аккаунта?",
    dashboard: "Панель", accounts: "Счета", cards: "Карты",
    transfers: "Переводы", transactions: "Операции", settings: "Настройки",
    welcome: "Добро пожаловать", totalBalance: "Общий баланс", recentTx: "Последние операции",
    newTransfer: "Новый перевод", openAccount: "Открыть счёт", issueCard: "Заказать карту",
    accountName: "Название счёта", currency: "Валюта", accountType: "Тип счёта",
    current: "Текущий", savings: "Сберегательный", deposit: "Депозит",
    debit: "Дебетовая", credit: "Кредитная", virtual: "Виртуальная",
    fromAccount: "Со счёта", toIban: "IBAN получателя", recipientName: "Имя получателя",
    amount: "Сумма", description: "Описание", send: "Отправить",
    cancel: "Отмена", confirm: "Подтвердить", save: "Сохранить",
    language: "Язык", theme: "Тема", light: "Светлая", dark: "Тёмная",
    cardHolder: "Держатель", cardNumber: "Номер карты", expiry: "Срок",
    block: "Заблокировать", unblock: "Разблокировать", freeze: "Заморозить",
    success: "Успех", error: "Ошибка", reference: "Референс",
    noData: "Нет данных", search: "Поиск", date: "Дата",
    balance: "Баланс", type: "Тип", status: "Статус",
    in: "Входящий", out: "Исходящий", pending: "В ожидании", completed: "Завершён", failed: "Неудача",
    profile: "Профиль", security: "Безопасность",
    insufficientFunds: "Недостаточно средств", invalidIban: "Неверный IBAN",
    transferDone: "Перевод выполнен", copied: "Скопировано",
    quickActions: "Быстрые действия", notifications: "Уведомления",
    showDetails: "Показать детали", hideDetails: "Скрыть",
    welcomeBack: "С возвращением",
    landingHero: "Банковские услуги нового уровня",
    landingSub: "Безопасные, быстрые и умные банковские решения с APEX BANK.",
    getStarted: "Начать",
  },
} as const;

type Key = keyof typeof dict["en"];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "az", setLang: () => {}, t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("az");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("atu_lang")) as Lang | null;
    if (saved && ["az", "en", "ru"].includes(saved)) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("atu_lang", l);
  };
  const t = (k: Key) => (dict[lang] as Record<string, string>)[k] ?? (dict.en as Record<string, string>)[k] ?? k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
