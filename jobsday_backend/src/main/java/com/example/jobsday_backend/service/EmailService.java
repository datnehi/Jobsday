package com.example.jobsday_backend.service;

import okhttp3.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class EmailService {

    @Value("${mail.key}")
    private String apiKey;

    @Value("${mail.secret}")
    private String senderEmail;

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build();

    public boolean sendEmail(String to, String subject, String text) {

        if (to == null || to.isBlank()) return false;

        try {
            JSONObject json = new JSONObject();
            json.put("sender", new JSONObject().put("email", senderEmail));
            json.put("to", new org.json.JSONArray()
                    .put(new JSONObject().put("email", to)));
            json.put("subject", subject);
            String htmlText = text.replace("\r\n", "<br>").replace("\n", "<br>");
            json.put("htmlContent",
                    "<div style='font-size:16px; line-height:1.6;'>" +
                            htmlText +
                            "</div>"
            );

            RequestBody body = RequestBody.create(
                    json.toString(),
                    MediaType.parse("application/json")
            );

            Request request = new Request.Builder()
                    .url("https://api.brevo.com/v3/smtp/email")
                    .post(body)
                    .addHeader("accept", "application/json")
                    .addHeader("api-key", apiKey)
                    .addHeader("content-type", "application/json")
                    .build();

            try (Response response = client.newCall(request).execute()) {

                if (!response.isSuccessful()) {
                    System.out.println("Send email error: " + response.code());
                    System.out.println(response.body().string());
                    return false;
                }

                return true;
            }

        } catch (Exception e) {
            System.out.println("Send email exception: " + e.getMessage());
            return false;
        }
    }
}
