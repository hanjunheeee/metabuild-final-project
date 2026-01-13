import { useNavigate } from 'react-router-dom'
import useProfileEdit from '../hooks/useProfileEdit'

function ProfilePage() {
  const navigate = useNavigate()
  
  const {
    user,
    isEditing,
    isLoading,
    nickname,
    setNickname,
    photoPreview,
    topTitles,
    currentProfileImage,
    fileInputRef,
    handlePhotoChange,
    handlePhotoRemove,
    handleStartEdit,
    handleCancel,
    handleSave,
    triggerFileInput,
  } = useProfileEdit()

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800">프로필 정보</h2>
          <p className="text-gray-400 text-sm mt-1">내 프로필을 확인하고 수정할 수 있습니다.</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 text-sm font-medium bg-main-bg text-white hover:bg-sub-bg transition-colors"
          >
            수정하기
          </button>
        )}
      </div>

      {/* 프로필 섹션 */}
      <div className="space-y-6">
        {/* 프로필 이미지 */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-main-bg flex items-center justify-center text-white text-2xl font-bold overflow-hidden cursor-pointer">
              {currentProfileImage ? (
                <img 
                  src={currentProfileImage} 
                  alt="프로필" 
                  className="w-full h-full object-cover"
                />
              ) : (
                nickname?.charAt(0) || user?.nickname?.charAt(0) || '?'
              )}
            </div>
            {isEditing && (
              <button 
                onClick={triggerFileInput}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-gray-700 transition-colors"
              >
                +
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800">{user?.nickname || '닉네임 없음'}</h3>
              {topTitles.length > 0 && (
                <div className="flex items-center gap-1">
                  {topTitles.map((title) => (
                    <span 
                      key={title.titleId} 
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200 rounded-full"
                      title={`${title.titleName} (${title.titleType === 'LIKE' ? '댓글 좋아요' : '팔로워'} 달성)`}
                    >
                      <span className="mr-1">{title.titleIcon}</span>
                      {title.titleName}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">{user?.email || '이메일 없음'}</p>
            {isEditing && photoPreview && (
              <button
                onClick={handlePhotoRemove}
                className="mt-2 text-xs text-red-500 hover:text-red-600"
              >
                새 사진 취소
              </button>
            )}
          </div>
        </div>

        {/* 정보 입력 폼 */}
        <div className="grid gap-5">
          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={!isEditing}
              maxLength={5}
              className={`w-full px-4 py-2.5 border text-sm transition-all ${
                isEditing
                  ? 'border-gray-300 focus:ring-1 focus:ring-main-bg focus:border-main-bg'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
            />
            {isEditing && (
              <p className="text-xs text-gray-400 mt-1">2~5자의 영문, 숫자, 한글만 사용 가능합니다.</p>
            )}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              defaultValue={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-500 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">이메일은 변경할 수 없습니다.</p>
          </div>
        </div>

        {/* 저장/취소 버튼 */}
        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-main-bg text-white text-sm font-medium hover:bg-sub-bg transition-colors disabled:opacity-50"
            >
              {isLoading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        )}

        {/* 비밀번호 변경 섹션 */}
        {!isEditing && (
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">비밀번호</h3>
                <p className="text-xs text-gray-400 mt-1">계정 보안을 위해 정기적으로 변경해주세요.</p>
              </div>
              <button
                onClick={() => navigate('/mypage/change-password')}
                className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                비밀번호 변경
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
