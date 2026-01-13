package com.example.ex02.Title.service;

import com.example.ex02.Title.dto.RankingUserDTO;
import com.example.ex02.Title.repository.RankingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankingService {

    private final RankingRepository rankingRepository;

    /**
     * 댓글 좋아요 TOP N 조회
     */
    public List<RankingUserDTO> getTopUsersByCommentLikes(int limit) {
        List<Object[]> results = rankingRepository.findTopUsersByCommentLikes(limit);
        return convertToRankingDTO(results);
    }

    /**
     * 팔로워 TOP N 조회
     */
    public List<RankingUserDTO> getTopUsersByFollowers(int limit) {
        List<Object[]> results = rankingRepository.findTopUsersByFollowers(limit);
        return convertToRankingDTO(results);
    }

    /**
     * Object[] 결과를 RankingUserDTO로 변환
     */
    private List<RankingUserDTO> convertToRankingDTO(List<Object[]> results) {
        List<RankingUserDTO> rankings = new ArrayList<>();
        int rank = 1;
        
        for (Object[] row : results) {
            RankingUserDTO dto = RankingUserDTO.builder()
                    .rank(rank++)
                    .userId(((Number) row[0]).longValue())
                    .nickname((String) row[1])
                    .userPhoto((String) row[2])
                    .count(((Number) row[3]).longValue())
                    .build();
            rankings.add(dto);
        }
        
        return rankings;
    }
}

