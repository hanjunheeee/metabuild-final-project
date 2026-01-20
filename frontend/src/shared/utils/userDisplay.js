/**
 * 사용자 표시 정보 유틸
 * 관리자인 경우 공식 이름/아이콘 표시
 */
import adminLogo from '@/assets/image/logo2_nukki.png'

// 관리자 표시 정보
const ADMIN_DISPLAY = {
  nickname: '빌릴수e서울',
  photo: adminLogo,  // 관리자 로고 이미지 경로
  badge: '👑',  // 관리자 뱃지
}

/**
 * 사용자가 관리자인지 확인
 * @param {object} user - 사용자 객체 { role, ... }
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.role === 'ADMIN'
}

/**
 * 표시용 닉네임 반환
 * @param {object} user - 사용자 객체 { role, nickname, userNickname, ... }
 * @returns {string}
 */
export const getDisplayName = (user) => {
  if (isAdmin(user)) return ADMIN_DISPLAY.nickname
  // nickname 또는 userNickname (댓글 DTO에서 사용)
  return user?.nickname || user?.userNickname || '익명'
}

/**
 * 표시용 닉네임 + 뱃지 반환
 * @param {object} user - 사용자 객체
 * @returns {string}
 */
export const getDisplayNameWithBadge = (user) => {
  if (isAdmin(user)) return `${ADMIN_DISPLAY.badge} ${ADMIN_DISPLAY.nickname}`
  return user?.nickname || '익명'
}

/**
 * 표시용 프로필 사진 URL 반환
 * @param {object} user - 사용자 객체 { role, userPhoto, userProfileImage, ... }
 * @param {string} baseUrl - 이미지 기본 URL (기본: /uploads/profile/)
 * @returns {string}
 */
export const getDisplayPhoto = (user, baseUrl = '/uploads/profile/') => {
  if (isAdmin(user)) return ADMIN_DISPLAY.photo
  // userPhoto 또는 userProfileImage (댓글 DTO에서 사용)
  const photo = user?.userPhoto || user?.userProfileImage
  if (!photo) return null
  // 이미 전체 URL인 경우 그대로 반환
  if (photo.startsWith('http')) return photo
  return `${baseUrl}${photo}`
}

/**
 * 관리자 뱃지 반환
 * @param {object} user - 사용자 객체
 * @returns {string|null}
 */
export const getAdminBadge = (user) => {
  if (isAdmin(user)) return ADMIN_DISPLAY.badge
  return null
}

/**
 * 관리자 설정 상수 내보내기 (커스텀용)
 */
export const ADMIN_CONFIG = ADMIN_DISPLAY

