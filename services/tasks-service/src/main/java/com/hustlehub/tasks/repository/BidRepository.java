package com.hustlehub.tasks.repository;

import com.hustlehub.tasks.entity.Bid;
import com.hustlehub.tasks.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BidRepository extends JpaRepository<Bid, UUID> {

    List<Bid> findByTaskOrderByCreatedAtDesc(Task task);

    List<Bid> findByTaskAndTaskerId(Task task, UUID taskerId);

    long countByTask(Task task);
}
