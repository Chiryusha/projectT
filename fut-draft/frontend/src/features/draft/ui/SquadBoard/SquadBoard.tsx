import { useMemo, useState } from "react";
import classNames from "classnames";

import { getLayoutForFormation } from "@/entities/formation";
import {
  getAverageRating,
  MiniPickedCard,
  resolvePlayerImageUrl,
} from "@/entities/player";
import stadiumBackground from "@/shared/assets/first-page.jpg";

import { calculateDraftChemistryPreview } from "../../lib/chemistryPreview";
import type {
  DraftFormation,
  DraftPick,
  DraftPlayerCard,
  DraftSessionState,
} from "../../model/types";
import EmptySlotCard from "../EmptySlotCard/EmptySlotCard";
import "./SquadBoard.scss";

type SquadBoardProps = {
  formation: DraftFormation;
  isLoadingOptions: boolean;
  isPicking: boolean;
  isSwapping: boolean;
  openedPickSlotNo: number | null;
  selectedSwapSlotNo: number | null;
  onClosePickDrawer: () => void;
  onPickPlayer: (cardId: string) => void;
  onSlotClick: (slotNo: number, isFilled: boolean) => void;
  sessionState: DraftSessionState;
};

const SquadBoard = ({
  formation,
  isLoadingOptions,
  isPicking,
  isSwapping,
  openedPickSlotNo,
  selectedSwapSlotNo,
  onClosePickDrawer,
  onPickPlayer,
  onSlotClick,
  sessionState,
}: SquadBoardProps) => {
  const [previewCard, setPreviewCard] = useState<DraftPlayerCard | null>(null);
  const slots = getLayoutForFormation(formation);
  const isBusy = isPicking || isSwapping || isLoadingOptions;
  const isPickDrawerOpen =
    openedPickSlotNo !== null &&
    sessionState.session.status === "IN_PROGRESS";
  const previewPick = useMemo<DraftPick | null>(() => {
    if (!previewCard || openedPickSlotNo === null) {
      return null;
    }

    return {
      pickedAt: "",
      playerCard: previewCard,
      slotNo: openedPickSlotNo,
    };
  }, [openedPickSlotNo, previewCard]);
  const displayedPicks = useMemo(() => {
    if (!previewPick) {
      return sessionState.picks;
    }

    return [
      ...sessionState.picks.filter((pick) => pick.slotNo !== previewPick.slotNo),
      previewPick,
    ];
  }, [previewPick, sessionState.picks]);
  const previewChemistry = useMemo(() => {
    if (!previewPick) {
      return null;
    }

    return calculateDraftChemistryPreview(displayedPicks, formation);
  }, [displayedPicks, formation, previewPick]);
  const displayedTeamChemistry =
    previewChemistry?.teamChemistry ?? sessionState.chemistry.teamChemistry;
  const realPicksBySlot = useMemo(() => {
    return new Map(sessionState.picks.map((pick) => [pick.slotNo, pick]));
  }, [sessionState.picks]);
  const picksBySlot = useMemo(() => {
    return new Map(displayedPicks.map((pick) => [pick.slotNo, pick]));
  }, [displayedPicks]);
  const getSlotChemistry = (slotNo: number) => {
    if (previewChemistry) {
      return previewChemistry.players.get(slotNo) ?? 0;
    }

    return (
      sessionState.chemistry.players.find((player) => player.slotNo === slotNo)
        ?.chemistry ?? 0
    );
  };

  return (
    <div className="squad-board">
      <div
        className="squad-board__background"
        style={{ backgroundImage: `url(${stadiumBackground})` }}
      />
      <div className="squad-board__vignette" />
      <div className="squad-board__field">
        <div className="squad-board__field-half-line" />
        <div className="squad-board__field-center-circle" />
      </div>

      <div className="squad-board__slots">
        {slots.map((slot) => {
          const realPick = realPicksBySlot.get(slot.slotNo);
          const pick = picksBySlot.get(slot.slotNo);
          const isCurrent =
            sessionState.session.status === "IN_PROGRESS" &&
            (openedPickSlotNo === slot.slotNo ||
              (!openedPickSlotNo &&
                sessionState.session.currentSlot === slot.slotNo));

          return (
            <button
              className={classNames("squad-board__slot", {
                "squad-board__slot--clickable": Boolean(realPick) || !pick,
                "squad-board__slot--selected":
                  selectedSwapSlotNo === slot.slotNo,
                "squad-board__slot--preview": previewPick?.slotNo === slot.slotNo,
              })}
              data-testid={`draft-slot-${slot.slotNo}`}
              disabled={isBusy}
              key={slot.slotNo}
              onClick={() => onSlotClick(slot.slotNo, Boolean(realPick))}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              type="button"
            >
              <div
                className={classNames("squad-board__slot-card", {
                  "squad-board__slot-card--current": isCurrent,
                })}
              >
                {pick ? (
                  <MiniPickedCard card={pick.playerCard} />
                ) : (
                  <EmptySlotCard label={slot.label} />
                )}
              </div>
              <div className="squad-board__slot-meta">
                <span
                  className={classNames("squad-board__slot-label", {
                    "squad-board__slot-label--filled": pick,
                  })}
                >
                  {slot.label}
                </span>
                <span className="squad-board__slot-chemistry">
                  {pick ? getSlotChemistry(slot.slotNo) : 0}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="squad-board__bench">
        <div className="squad-board__bench-list">
          {Array.from({ length: sessionState.session.totalSlots - 11 }, (_, index) => {
            const slotNo = index + 12;
            const realPick = realPicksBySlot.get(slotNo);
            const pick = picksBySlot.get(slotNo);
            const isCurrent =
              sessionState.session.status === "IN_PROGRESS" &&
              (openedPickSlotNo === slotNo ||
                (!openedPickSlotNo &&
                  sessionState.session.currentSlot === slotNo));

            return (
              <button
                className={classNames("squad-board__bench-item", {
                  "squad-board__bench-item--clickable": Boolean(realPick) || !pick,
                })}
                data-testid={`draft-slot-${slotNo}`}
                disabled={isBusy}
                key={slotNo}
                onClick={() => onSlotClick(slotNo, Boolean(realPick))}
                type="button"
              >
                <div className="squad-board__bench-label">
                  SUB {index + 1}
                </div>
                <div
                  className={classNames("squad-board__bench-card", {
                    "squad-board__bench-card--current": isCurrent,
                    "squad-board__bench-card--selected":
                      selectedSwapSlotNo === slotNo,
                  })}
                >
                  {pick ? (
                    <MiniPickedCard card={pick.playerCard} />
                  ) : (
                    <EmptySlotCard label="SUB" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="squad-board__bench-summary">
          <p className="squad-board__bench-summary-title">Draft Squad</p>
          <div className="squad-board__bench-stats">
            <div className="squad-board__bench-stat">
              <span
                className="squad-board__bench-stat-value"
                data-testid="draft-rating"
              >
                {getAverageRating(displayedPicks)}
              </span>
              <span className="squad-board__bench-stat-label">Rating</span>
            </div>
            <div className="squad-board__bench-stat squad-board__bench-stat--chemistry">
              <span
                className="squad-board__bench-stat-value"
                data-testid="draft-chemistry"
              >
                {displayedTeamChemistry}
              </span>
              <span className="squad-board__bench-stat-label">Chemistry</span>
            </div>
          </div>
        </div>
      </div>

      {isPickDrawerOpen ? (
        <aside className="squad-board__pick-drawer" data-testid="pick-drawer">
          <div className="squad-board__pick-drawer-header">
            <div>
              <p className="squad-board__pick-drawer-kicker">Player pick</p>
              <h2 className="squad-board__pick-drawer-title">
                Слот {openedPickSlotNo}
              </h2>
            </div>
            <button
              className="squad-board__pick-drawer-close"
              onClick={() => {
                setPreviewCard(null);
                onClosePickDrawer();
              }}
              type="button"
            >
              Закрыть
            </button>
          </div>

          <div className="squad-board__pick-options">
            {isLoadingOptions || sessionState.optionsSlotNo !== openedPickSlotNo ? (
              <div className="squad-board__pick-options-empty">
                Загружаем игроков...
              </div>
            ) : (
              sessionState.options.map((option) => (
                <button
                  className="squad-board__pick-option"
                  data-testid="pick-option"
                  disabled={isPicking}
                  key={option.playerCard.id}
                  onBlur={() => setPreviewCard(null)}
                  onClick={() => {
                    setPreviewCard(null);
                    onPickPlayer(option.playerCard.id);
                  }}
                  onFocus={() => setPreviewCard(option.playerCard)}
                  onPointerCancel={() => setPreviewCard(null)}
                  onPointerDown={() => setPreviewCard(option.playerCard)}
                  onPointerEnter={() => setPreviewCard(option.playerCard)}
                  onPointerLeave={() => setPreviewCard(null)}
                  onPointerUp={() => setPreviewCard(null)}
                  type="button"
                >
                  <span className="squad-board__pick-option-rating">
                    {option.playerCard.overall}
                  </span>
                  <span className="squad-board__pick-option-photo">
                    {resolvePlayerImageUrl(option.playerCard.player.imageUrl) ? (
                      <img
                        alt={option.playerCard.player.fullName}
                        loading="lazy"
                        src={
                          resolvePlayerImageUrl(option.playerCard.player.imageUrl) ??
                          undefined
                        }
                      />
                    ) : (
                      option.playerCard.basePosition
                    )}
                  </span>
                  <span className="squad-board__pick-option-main">
                    <span className="squad-board__pick-option-name">
                      {option.playerCard.player.fullName}
                    </span>
                    <span className="squad-board__pick-option-meta">
                      {option.playerCard.basePosition} · {option.playerCard.player.club}
                    </span>
                  </span>
                  <span className="squad-board__pick-option-rarity">
                    {option.playerCard.rarity}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="squad-board__pick-drawer-footer">
            GK: {sessionState.session.goalkeepersPicked}/
            {sessionState.session.goalkeepersRequired}
          </div>
        </aside>
      ) : null}
    </div>
  );
};

export default SquadBoard;
