package com.example.ex02.Book.llm;

import java.util.List;

public class GeminiResponse {

    private List<Candidate> candidates;

    public List<Candidate> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<Candidate> candidates) {
        this.candidates = candidates;
    }

    public String firstText() {
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }
        Candidate candidate = candidates.get(0);
        if (candidate == null || candidate.getContent() == null) {
            return null;
        }
        List<Content.Part> parts = candidate.getContent().getParts();
        if (parts == null || parts.isEmpty()) {
            return null;
        }
        Content.Part part = parts.get(0);
        return part != null ? part.getText() : null;
    }

    public static class Candidate {

        private Content content;

        public Candidate() {
        }

        public Content getContent() {
            return content;
        }

        public void setContent(Content content) {
            this.content = content;
        }
    }

    public static class Content {

        private List<Part> parts;

        public Content() {
        }

        public List<Part> getParts() {
            return parts;
        }

        public void setParts(List<Part> parts) {
            this.parts = parts;
        }

        public static class Part {

            private String text;

            public Part() {
            }

            public String getText() {
                return text;
            }

            public void setText(String text) {
                this.text = text;
            }
        }
    }
}
