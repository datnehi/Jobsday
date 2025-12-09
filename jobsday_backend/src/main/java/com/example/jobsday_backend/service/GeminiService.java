package com.example.jobsday_backend.service;

import com.example.jobsday_backend.dto.CvResult;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class GeminiService {

    @Value("${ai.key}")
    private String apiKey;

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .build();

    public CvResult analyzeCV(String cvText) throws Exception {

        if (cvText == null) cvText = "";

        if (cvText.length() > 10000) {
            cvText = cvText.substring(0, 10000);
        }
        
        String prompt = """
                Bạn là hệ thống ATS chuyên phân tích CV ứng viên Việt Nam.
                
                Nếu nội dung dưới đây **KHÔNG PHẢI CV**, chỉ trả về JSON rỗng:
                {
                    "jobTitle": null,
                    "level": null,
                    "experience": null,
                    "skills": []
                }
                
                Nếu là CV, hãy trích xuất thông tin theo định dạng JSON sau:
                {
                    "jobTitle": "Tên vị trí ứng tuyển hoặc vị trí chính trong CV, ví dụ: Marketing Intern",
                    "level": "intern | fresher | junior | middle | senior",
                    "experience": "số năm kinh nghiệm dạng text, ví dụ: 0 | 1 | 2 | 3 | 4 | 5 | tren5 | duoi1",
                    "skills": ["skill1", "skill2", "skill3"]
                }

                CHỈ TRẢ VỀ JSON. KHÔNG giải thích.

                Nội dung CV:
                """ + cvText;

        String jsonBody = "{ \"contents\": [{ \"parts\": [{\"text\": \"" +
                prompt.replace("\"", "\\\"") +
                "\"}]}]}";

        RequestBody body = RequestBody.create(
                jsonBody,
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url("https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey)
                .post(body)
                .build();

        Response response = client.newCall(request).execute();

        if (!response.isSuccessful()) {
            throw new RuntimeException("Gemini API error: " + response.code());
        }

        String responseBody = response.body().string();

        String extractedText = new JSONObject(responseBody)
                .getJSONArray("candidates")
                .getJSONObject(0)
                .getJSONObject("content")
                .getJSONArray("parts")
                .getJSONObject(0)
                .getString("text");

        String jsonOnly = extractJsonFromString(extractedText);
        JSONObject json = new JSONObject(jsonOnly);

        CvResult result = new CvResult();
        result.setJobTitle(cleanText(json.optString("jobTitle", null)));
        result.setLevel(cleanText(json.optString("level", null)));
        result.setExperience(cleanText(json.optString("experience", null)));

        List<String> skills = new ArrayList<>();
        if (json.has("skills")) {
            JSONArray arr = json.getJSONArray("skills");
            for (int i = 0; i < arr.length(); i++) {
                String skill = cleanText(arr.getString(i));
                if (!skill.isBlank()) skills.add(skill);
            }
        }
        result.setSkills(skills);

        return result;
    }

    private String extractJsonFromString(String text) {
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        } else {
            throw new RuntimeException("Cannot find JSON in Gemini response: " + text);
        }
    }

    public String cleanText(String input) {
        if (input == null) return null;
        return input.replaceAll("\u0000", "")
                .replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "")
                .trim();
    }
}
