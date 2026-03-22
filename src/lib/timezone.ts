import { format, parseISO } from 'date-fns'
import { ko, enUS, ja, zhCN } from 'date-fns/locale'

// 지원하는 언어별 로케일 매핑
const locales = {
  ko: ko,
  en: enUS,
  ja: ja,
  zh: zhCN,
}

// 사용자의 로케일 감지
export function getUserLocale(): string {
  if (typeof window === 'undefined') return 'ko'
  
  const browserLocale = navigator.language || navigator.languages?.[0] || 'ko'
  const lang = browserLocale.split('-')[0]
  
  return locales[lang as keyof typeof locales] ? lang : 'ko'
}

// 사용자의 시간대 감지
export function getUserTimezone(): string {
  if (typeof window === 'undefined') return 'Asia/Seoul'
  
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'Asia/Seoul'
  }
}

// 한국 시간을 사용자 로컬 시간으로 변환
export function convertUTCToLocal(koreanTime: string, formatStr: string = 'HH:mm'): string {
  try {
    // 한국 시간을 UTC로 변환 (한국은 UTC+9)
    const koreanDate = parseISO(koreanTime)
    const utcDate = new Date(koreanDate.getTime() - (9 * 60 * 60 * 1000)) // UTC+9에서 UTC로
    
    // 사용자의 로컬 시간대로 변환
    const userTimezone = getUserTimezone()
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: userTimezone }))
    
    const locale = getUserLocale()
    const localeObj = locales[locale as keyof typeof locales] || ko
    
    return format(localDate, formatStr, { locale: localeObj })
  } catch {
    return koreanTime
  }
}

// 사용자 로컬 시간을 UTC로 변환
export function convertLocalToUTC(localTime: string, date: string = ''): string {
  try {
    const [hours, minutes] = localTime.split(':').map(Number)
    const localDate = date ? parseISO(date) : new Date()
    localDate.setHours(hours, minutes, 0, 0)
    
    // UTC로 변환
    const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000))
    return utcDate.toISOString().slice(0, 19) + 'Z'
  } catch {
    return localTime
  }
}

// 날짜와 시간을 사용자 로컬 시간대로 포맷팅
export function formatLocalDateTime(dateTime: string, formatStr: string = 'M월 d일 (E) HH:mm'): string {
  try {
    const date = parseISO(dateTime)
    const locale = getUserLocale()
    const localeObj = locales[locale as keyof typeof locales] || ko
    
    return format(date, formatStr, { locale: localeObj })
  } catch {
    return dateTime
  }
}

// 시간대 정보 표시
export function getTimezoneInfo(): { name: string; offset: string } {
  if (typeof window === 'undefined') {
    return { name: 'Asia/Seoul', offset: '+09:00' }
  }
  
  try {
    const timezone = getUserTimezone()
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const offsetHours = Math.abs(Math.floor(offset / 60))
    const offsetMinutes = Math.abs(offset % 60)
    const offsetStr = `${offset <= 0 ? '+' : '-'}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
    
    return { name: timezone, offset: offsetStr }
  } catch {
    return { name: 'Asia/Seoul', offset: '+09:00' }
  }
}

// 한국 시간을 특정 시간대로 변환
export function convertKoreanTimeToTimezone(koreanTime: string, targetTimezone: string): string {
  try {
    // 한국 시간을 UTC로 변환 (한국은 UTC+9)
    const koreanDate = parseISO(koreanTime)
    const utcDate = new Date(koreanDate.getTime() - (9 * 60 * 60 * 1000))
    
    // 타겟 시간대로 변환
    const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone: targetTimezone }))
    return targetDate.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: targetTimezone 
    })
  } catch {
    return koreanTime
  }
}

// 시간대별 시간 변환 예시
export function getTimeInTimezone(time: string, targetTimezone: string): string {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    
    // 타겟 시간대로 변환
    const targetDate = new Date(date.toLocaleString('en-US', { timeZone: targetTimezone }))
    return targetDate.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: targetTimezone 
    })
  } catch {
    return time
  }
}

// 현재 한국 시간 가져오기
export function getCurrentKoreanTime(): { date: string; time: string } {
  try {
    // 한국 시간 기준으로 현재 시각을 구함
    const now = new Date()
    const koreanNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    return {
      date: format(koreanNow, 'yyyy-MM-dd'),
      time: format(koreanNow, 'HH:mm')
    }
  } catch {
    const now = new Date()
    return {
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm')
    }
  }
}

// 사용자 현지 시간을 한국 시간으로 변환
export function convertLocalTimeToKorean(localDate: string, localTime: string, userTimezone: string): string {
  try {
    // 사용자 시간대에서 해당 시간을 만들기
    const year = parseInt(localDate.split('-')[0])
    const month = parseInt(localDate.split('-')[1]) - 1 // 월은 0부터 시작
    const day = parseInt(localDate.split('-')[2])
    const hour = parseInt(localTime.split(':')[0])
    const minute = parseInt(localTime.split(':')[1])
    
    // 사용자 시간대에서 UTC 시간으로 변환
    const localDateObj = new Date()
    localDateObj.setFullYear(year, month, day)
    localDateObj.setHours(hour, minute, 0, 0)
    
    // 사용자 시간대의 UTC 오프셋 계산
    const userOffset = getTimezoneOffset(userTimezone, localDateObj)
    const koreanOffset = 9 * 60 // 한국은 UTC+9 (분 단위)
    
    // UTC 기준으로 변환 후 한국 시간으로 변환
    const utcTime = localDateObj.getTime() - (userOffset * 60 * 1000)
    const koreanTime = new Date(utcTime + (koreanOffset * 60 * 1000))
    
    // "YYYY-MM-DD HH:mm:ss" 형식으로 반환
    return format(koreanTime, 'yyyy-MM-dd HH:mm:ss')
  } catch (error) {
    console.error('시간 변환 오류:', error)
    // 변환 실패시 원본 반환
    return `${localDate} ${localTime}:00`
  }
}

// 특정 시간대의 UTC 오프셋을 분 단위로 반환
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    // 해당 시간대에서의 시간을 구함
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
    const timezoneDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
    
    // 오프셋 계산 (분 단위)
    return (timezoneDate.getTime() - utcDate.getTime()) / (60 * 1000)
  } catch {
    // 기본값으로 현재 시스템의 오프셋 반환
    return -date.getTimezoneOffset()
  }
}

// 한국 시간을 사용자 현지 시간으로 변환
export function convertKoreanTimeToLocal(koreanDateTime: string, userTimezone: string): { date: string; time: string } {
  try {
    // 한국 시간을 Date 객체로 생성
    const koreanDate = new Date(koreanDateTime.replace(' ', 'T'))
    
    // 한국 시간에서 UTC로 변환
    const utcTime = new Date(koreanDate.getTime() - (9 * 60 * 60 * 1000)) // UTC+9에서 UTC로
    
    // UTC에서 사용자 시간대로 변환
    const localTime = new Date(utcTime.toLocaleString('en-US', { timeZone: userTimezone }))
    
    return {
      date: format(localTime, 'yyyy-MM-dd'),
      time: format(localTime, 'HH:mm')
    }
  } catch (error) {
    console.error('한국 시간 변환 오류:', error)
    const [date, time] = koreanDateTime.split(' ')
    return {
      date,
      time: time.slice(0, 5) // "HH:mm" 형식으로
    }
  }
}

// 시간대 감지 및 변환 정보 반환
export function getTimezoneConversionInfo(localDate: string, localTime: string) {
  const userTimezone = getUserTimezone()
  const koreanTime = convertLocalTimeToKorean(localDate, localTime, userTimezone)
  const timezoneInfo = getTimezoneInfo()
  
  return {
    localDateTime: `${localDate} ${localTime}:00`,
    koreanDateTime: koreanTime,
    userTimezone,
    timezoneInfo
  }
} 