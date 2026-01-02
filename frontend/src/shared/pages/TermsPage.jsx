function TermsPage() {
  return (
    <div className="flex-1 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">이용약관</h1>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 MetaBuild(이하 "회사")가 제공하는 도서 커뮤니티 서비스(이하 "서비스")의 
              이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제2조 (용어의 정의)</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>"서비스"란 회사가 제공하는 도서 정보 조회, 커뮤니티 활동 등의 서비스를 말합니다.</li>
              <li>"회원"이란 본 약관에 동의하고 회원가입을 완료한 자를 말합니다.</li>
              <li>"아이디(ID)"란 회원의 식별과 서비스 이용을 위하여 회원이 설정한 이메일 주소를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
            <p>
              본 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다. 
              회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 
              변경된 약관은 서비스 내 공지사항을 통해 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제4조 (회원가입)</h2>
            <p>
              회원가입은 이용자가 본 약관에 동의하고, 회사가 정한 가입 양식에 따라 
              회원정보를 기입한 후 회원가입 신청을 하면 회사가 이를 승낙함으로써 체결됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제5조 (서비스의 이용)</h2>
            <p>
              서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 
              1일 24시간 운영을 원칙으로 합니다. 다만, 시스템 점검 등의 사유로 
              서비스가 일시 중단될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제6조 (회원의 의무)</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>회원은 본 약관 및 회사의 공지사항을 준수하여야 합니다.</li>
              <li>회원은 타인의 권리를 침해하거나 법령에 위반되는 행위를 하여서는 안 됩니다.</li>
              <li>회원은 자신의 아이디와 비밀번호를 안전하게 관리할 책임이 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제7조 (면책조항)</h2>
            <p>
              회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력으로 인하여 
              서비스를 제공할 수 없는 경우에는 서비스 제공에 대한 책임이 면제됩니다.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
          <p>시행일: 2026년 1월 1일</p>
        </div>
      </div>
    </div>
  )
}

export default TermsPage

