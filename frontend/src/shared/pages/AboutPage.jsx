function AboutPage() {
  return (
    <div className="flex-1 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">사이트 소개</h1>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          {/* 개발배경 및 필요성 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">개발배경 및 필요성</h2>
            <p className="mb-3">
              최근 독서 인구는 감소 추세를 보이고 있으나, 도서를 구매하거나 대여하기 전 
              다양한 정보를 비교·검토하려는 이용자들의 요구는 여전히 존재합니다. 
              현재 이용자들은 도서 정보, 구매 가격, 리뷰, 도서관 대여 가능 여부를 확인하기 위해 
              여러 플랫폼을 반복적으로 이용해야 하며, 이로 인해 정보 탐색의 비효율성과 피로도가 증가하고 있습니다.
            </p>
            <p className="mb-3">
              특히 도서 정보 제공, 온라인 구매, 도서관 대여 기능이 분리되어 운영되는 구조는 
              구매와 대여를 함께 고려한 합리적인 의사결정을 어렵게 만듭니다.
            </p>
            <p>
              본 프로젝트는 이러한 문제를 해결하기 위해 도서 검색부터 구매 · 대여 판단까지의 
              전 과정을 하나의 서비스 흐름으로 통합 제공하고자 합니다. 이를 통해 이용자의 정보 탐색 부담을 줄이고, 
              지역 도서관의 대출 가능 여부를 직관적으로 제공함으로써 도서 이용 편의성을 향상시키고자 합니다. 
              더 나아가 사용자 리뷰와 커뮤니티 기능을 결합한 참여형 도서 정보 플랫폼을 구축하는 것을 목표로 합니다.
            </p>
          </section>

          {/* 개발목표 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">개발목표</h2>
            <p className="mb-4">
              본 프로젝트의 개발 목표는 다음과 같습니다.
            </p>
            <ol className="list-decimal list-inside space-y-3">
              <li>
                도서 검색, 도서관련 게시글, 구매 정보, 대여 정보를 하나의 통합 플랫폼으로 제공
              </li>
              <li>
                공공데이터(API)와 커머스 데이터를 결합한 실질적인 의사결정 지원 서비스 구현
              </li>
              <li>
                사용자가 선택한 지역(구 단위)으로 지역 내 도서관의 실시간 대출 가능 여부 제공
              </li>
              <li>
                실사용 가능한 웹 서비스를 구현하여 팀 프로젝트의 완성도와 실효성 확보
              </li>
            </ol>
          </section>

          {/* 기존 서비스에 관한 고찰 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">기존 서비스(플랫폼)에 관한 고찰</h2>
            <p className="mb-3">
              기존의 포털 기반 도서 검색 서비스는 도서 기본 정보와 온라인 구매 정보 제공에 집중되어 있어 
              공공 도서관 대여 정보는 제한적으로 제공되고 있습니다. 반면, 도서관 개별 홈페이지에서는 
              소장 여부와 대출 상태 확인이 가능하지만, 이용자가 도서관별로 직접 접속해야 하는 불편함이 존재합니다.
            </p>
            <p className="mb-3">
              온라인 쇼핑몰 서비스는 가격 비교 측면에서는 유용하나, 도서관 이용과의 연계 기능이 제공되지 않아 
              구매와 대여를 동시에 고려하기 어렵습니다. 이러한 서비스 구조로 인해 이용자는 도서 선택 과정에서 
              여러 플랫폼을 반복적으로 이용해야 하며, 이는 정보 탐색 효율 저하로 이어집니다.
            </p>
            <p>
              본 프로젝트는 이러한 한계를 보완하여 구매와 대여 정보를 함께 제공하는 통합 도서 정보 서비스를 구현함으로써 
              기존 서비스의 공백을 해소하고자 합니다.
            </p>
          </section>

          {/* 주요 기능 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">주요 기능</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>통합 도서 검색:</strong> 도서 정보, 가격 비교, 리뷰를 한 곳에서 확인
              </li>
              <li>
                <strong>지역 도서관 대여 정보:</strong> 선택한 지역의 도서관별 실시간 대출 가능 여부 제공
              </li>
              <li>
                <strong>커뮤니티 기능:</strong> 사용자 리뷰 및 도서 관련 게시글 작성 및 공유
              </li>
              <li>
                <strong>북마크 기능:</strong> 관심 있는 도서를 저장하고 관리
              </li>
              <li>
                <strong>의사결정 지원:</strong> 구매와 대여를 함께 고려한 합리적인 선택 지원
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
          <p>MetaBuild 도서 통합 정보 플랫폼</p>
          <p className="mt-2">참여 인원: 한준희 · 정연종 · 김주성</p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage

