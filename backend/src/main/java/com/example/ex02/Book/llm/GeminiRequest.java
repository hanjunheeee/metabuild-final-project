package com.example.ex02.Book.llm;

import java.util.List;

public class GeminiRequest {

    private List<Content> contents;

    public GeminiRequest() {
    }

    public GeminiRequest(List<Content> contents) {
        this.contents = contents;
    }

    public static GeminiRequest fromPrompt(String prompt) {
        return new GeminiRequest(List.of(
                new Content(List.of(
                        new Part(prompt)
                ))
        ));
    }

    public List<Content> getContents() {
        return contents;
    }

    public void setContents(List<Content> contents) {
        this.contents = contents;
    }

    public static class Content {

        private List<Part> parts;

        public Content() {
        }

        public Content(List<Part> parts) {
            this.parts = parts;
        }

        public List<Part> getParts() {
            return parts;
        }

        public void setParts(List<Part> parts) {
            this.parts = parts;
        }
    }

    public static class Part {

        private String text;

        public Part() {
        }

        public Part(String text) {
            this.text = text;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }
}
