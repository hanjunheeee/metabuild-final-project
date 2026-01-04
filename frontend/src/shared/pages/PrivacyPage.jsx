import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function PrivacyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAgreed, setIsAgreed] = useState(false)
  const fromSignup = location.state?.from === 'signup'

  useEffect(() => {
    // 회원가입 페이지에서 온 경우 localStorage에서 동의 상태 확인
    if (fromSignup) {
      const agreed = localStorage.getItem('privacyAgreed') === 'true'
      setIsAgreed(agreed)
    }
  }, [fromSignup])

  const handleAgree = () => {
    const newAgreed = !isAgreed
    setIsAgreed(newAgreed)
    localStorage.setItem('privacyAgreed', newAgreed.toString())
    
    // 동의하면 잠시 후 회원가입 페이지로 돌아가기
    if (newAgreed) {
      setTimeout(() => {
        navigate('/signup', { state: { from: 'privacy' } })
      }, 500)
    }
  }

  return (
    <div className="flex-1 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. 개인정보의 수집 및 이용 목적</h2>
            <p>
              MetaBuild(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 
              처리하는 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 
              이용 목적이 변경될 시에는 사전 동의를 구할 것입니다.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>회원 가입 및 관리</li>
              <li>서비스 제공 및 운영</li>
              <li>고객 문의 응대</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. 수집하는 개인정보 항목</h2>
            <p>회사는 회원가입 및 서비스 이용을 위해 아래와 같은 개인정보를 수집합니다.</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li><strong>필수항목:</strong> 이메일, 비밀번호, 닉네임</li>
              <li><strong>선택항목:</strong> 프로필 사진</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. 개인정보의 보유 및 이용 기간</h2>
            <p>
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 
              개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>회원 정보: 회원 탈퇴 시까지</li>
              <li>관련 법령에 의한 보존: 해당 법령에서 정한 기간</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 
              다음의 경우를 제외하고는 정보주체의 사전 동의 없이 본래의 목적 범위를 초과하여 
              처리하거나 제3자에게 제공하지 않습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>정보주체로부터 별도의 동의를 받은 경우</li>
              <li>법률에 특별한 규정이 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. 개인정보의 파기</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
              지체없이 해당 개인정보를 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. 정보주체의 권리·의무</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
          <p>시행일: 2026년 1월 1일</p>
        </div>

        {/* 회원가입 페이지에서 온 경우 체크박스 표시 */}
        {fromSignup && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacyAgree"
                checked={isAgreed}
                onChange={handleAgree}
                className="w-5 h-5 mt-0.5 border-gray-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              />
              <label htmlFor="privacyAgree" className="text-sm text-gray-700 cursor-pointer">
                개인정보처리방침에 동의합니다.
              </label>
            </div>
            {isAgreed && (
              <p className="mt-2 text-xs text-green-600">개인정보처리방침에 동의하셨습니다. 회원가입 페이지로 돌아갑니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PrivacyPage

