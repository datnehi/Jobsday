package com.example.jobsday_backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.stream.DoubleStream;

@Entity
@Table(name = "skills")
@Data
public class Skills {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}
