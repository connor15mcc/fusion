package handler

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/0x2E/fusion/internal/config"
	"github.com/gin-gonic/gin"
)

type refreshRecordingPuller struct {
	noopPuller
	mu       sync.Mutex
	all      int
	selected [][]int64
}

func (p *refreshRecordingPuller) RefreshAll(context.Context) (int, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.all++
	return 0, nil
}

func (p *refreshRecordingPuller) RefreshFeeds(_ context.Context, ids []int64) (int, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.selected = append(p.selected, append([]int64(nil), ids...))
	return len(ids), nil
}

func (p *refreshRecordingPuller) snapshot() (int, [][]int64) {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.all, append([][]int64(nil), p.selected...)
}

func TestRefreshAllRunGuard(t *testing.T) {
	h := &Handler{}

	if !h.tryStartRefresh() {
		t.Fatal("expected first refresh start to succeed")
	}
	if h.tryStartRefresh() {
		t.Fatal("expected second refresh start to be rejected")
	}

	h.finishRefresh()

	if !h.tryStartRefresh() {
		t.Fatal("expected refresh to be allowed after finish")
	}
}

func TestRefreshFeedsRequestValidation(t *testing.T) {
	tests := []struct {
		name   string
		body   string
		status int
	}{
		{name: "missing ids", body: `{}`, status: http.StatusBadRequest},
		{name: "empty ids", body: `{"ids":[]}`, status: http.StatusBadRequest},
		{name: "non-positive id", body: `{"ids":[0]}`, status: http.StatusBadRequest},
		{name: "negative id", body: `{"ids":[-1]}`, status: http.StatusBadRequest},
		{name: "malformed body", body: `{`, status: http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &Handler{config: &config.Config{}}
			r := newTestRouter()
			r.POST("/api/feeds/refresh", h.refreshAllFeeds)

			w := performRequest(r, http.MethodPost, "/api/feeds/refresh", strings.NewReader(tt.body), map[string]string{"Content-Type": "application/json"})
			if w.Code != tt.status {
				t.Fatalf("status = %d, want %d: %s", w.Code, tt.status, w.Body.String())
			}
		})
	}
}

func TestRefreshFeedsDispatchesUniqueIDs(t *testing.T) {
	puller := &refreshRecordingPuller{}
	h := &Handler{
		config: &config.Config{PullTimeout: 30},
		puller: puller,
	}
	r := newTestRouter()
	r.POST("/api/feeds/refresh", h.refreshAllFeeds)

	body := mustJSONBody(t, gin.H{"ids": []int64{2, 1, 2}})
	w := performRequest(r, http.MethodPost, "/api/feeds/refresh", body, map[string]string{"Content-Type": "application/json"})
	if w.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202: %s", w.Code, w.Body.String())
	}

	waitForRefresh(t, h)
	all, selected := puller.snapshot()
	if all != 0 {
		t.Fatalf("RefreshAll called %d times, want 0", all)
	}
	if len(selected) != 1 {
		t.Fatalf("RefreshFeeds called %d times, want 1", len(selected))
	}
	if len(selected[0]) != 2 || selected[0][0] != 2 || selected[0][1] != 1 {
		t.Fatalf("selected ids = %v, want [2 1]", selected[0])
	}
}

func TestRefreshAllAcceptsEmptyBody(t *testing.T) {
	puller := &refreshRecordingPuller{}
	h := &Handler{
		config: &config.Config{PullTimeout: 30},
		puller: puller,
	}
	r := newTestRouter()
	r.POST("/api/feeds/refresh", h.refreshAllFeeds)

	w := performRequest(r, http.MethodPost, "/api/feeds/refresh", nil, nil)
	if w.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202: %s", w.Code, w.Body.String())
	}

	waitForRefresh(t, h)
	all, selected := puller.snapshot()
	if all != 1 {
		t.Fatalf("RefreshAll called %d times, want 1", all)
	}
	if len(selected) != 0 {
		t.Fatalf("RefreshFeeds called %d times, want 0", len(selected))
	}
}

func waitForRefresh(t *testing.T, h *Handler) {
	t.Helper()

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		h.refreshMu.Lock()
		running := h.refreshRunning
		h.refreshMu.Unlock()
		if !running {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatal("refresh did not finish before timeout")
}
