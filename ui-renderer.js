/**
 * Data Integration Layer - UI Renderer
 * Generates markup and sets loading/error states.
 */
(function() {
  // Utility for escaping HTML
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    if (typeof str !== 'string') str = String(str);
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  const UIRenderer = {
    /**
     * Renders the common customer summary details across the sidebar, header, and avatar panel.
     */
    renderSummary: function(data) {
      if (!data) return;

      // Helper function to update avatar container with image or initials
      function updateAvatar($el, imageUrl, initials) {
        $el.empty();
        if ($el.css('position') === 'static') {
          $el.css('position', 'relative');
        }
        $el.css('overflow', 'hidden');

        if (imageUrl) {
          const $img = $('<img>').attr('src', imageUrl).css({
            width: '100%',
            height: '100%',
            'object-fit': 'cover',
            position: 'absolute',
            inset: 0
          });
          $el.append($img);
        } else {
          // If it's the main orb, match the original internal structure: <div class="avatar-face">NM</div>
          if ($el.hasClass('avatar-inner')) {
            $el.append($('<div class="avatar-face"></div>').text(initials));
          } else {
            $el.text(initials);
          }
        }
      }

      // 1. Avatar Section (Scene 1)
      updateAvatar($('.avatar-inner'), data.avatarUrl || data.avatarImage, data.initials);
      $('.customer-name').text(data.name);
      $('.customer-subtitle').text(data.subtitle);

      // 2. Dashboard Header (Scene 2)
      updateAvatar($('.header-avatar-mini'), data.avatarUrl || data.avatarImage, data.initials);
      $('.header-name').text(data.name);
      $('.header-id').text(`CID · ${data.cid}`);
      
      $('.header-stat').each(function() {
        const label = $(this).find('.stat-label').text().trim().toLowerCase();
        const $val = $(this).find('.stat-value');
        if (label === 'net worth') {
          $val.text(data.netWorth);
        } else if (label === 'credit score') {
          $val.text(data.creditScore);
        } else if (label === 'risk level') {
          $val.text(data.riskLevel);
        }
      });

      // 3. Sidebar (Scene 2)
      updateAvatar($('.profile-avatar-large'), data.avatarUrl || data.avatarImage, data.initials);
      $('.profile-name').text(data.name);
      $('.profile-cid').text(data.cid);

      // Simple dot + label status indicator
      const isActive = (data.customerStatus || data.status || '').toLowerCase() === 'active';
      const $statusEl = $('#profile-status-pill');
      $statusEl
        .removeClass('active suspended')
        .addClass(isActive ? 'active' : 'suspended');
      $statusEl.find('.status-pill-label').text(isActive ? 'Active' : 'Suspended');

      // Avatar status ring glow
      const statusClass = isActive ? 'status-active' : 'status-suspended';
      $('#avatar-status-ring')
        .removeClass('status-active status-suspended')
        .addClass(statusClass);

      // Tier + segment badges — shown inside .customer-badge in scene 1
      const tierVal    = (data.tier || '').toLowerCase().trim();
      const $tierBadge = $('#cb-tier-badge');
      const $crown     = $('#sidebar-crown');

      if (tierVal === 'prime platinum') {
        $tierBadge.html('👑 PRIME PLATINUM').show();
        $crown.show();
      } else if (tierVal === 'prime') {
        $tierBadge.html('★ PRIME').show();
        $crown.hide();
      } else {
        $tierBadge.hide();
        $crown.hide();
      }

      // Trade Finance badge — shown only when tradeFinanceEnabled is true
      const $tradeBadge = $('#cb-trade-badge');
      data.tradeFinanceEnabled ? $tradeBadge.show() : $tradeBadge.hide();

      // Rating badge
      $('.profile-tier .rating-badge').text(`★ ${data.rating || 'A+'}`);



      $('.pstat-row').each(function() {
        const stat = $(this).attr('data-stat');
        const $val = $(this).find('.pstat-row-val');
        if (stat === 'gender') {
          const genderVal = data.gender || '';
          const genderIcon = genderVal.toLowerCase() === 'male' ? '♂️' : (genderVal.toLowerCase() === 'female' ? '♀️' : genderVal);
          const colorClass = genderVal.toLowerCase() === 'male' ? 'male-color' : (genderVal.toLowerCase() === 'female' ? 'female-color' : '');
          $val.html(`<span class="gender-icon ${colorClass}">${genderIcon}</span> ${genderVal}`);
        } else if (stat === 'branch') {
          $val.text(`${data.branchId} · ${data.branchName}`);
        } else if (stat === 'region') {
          $val.text(`${data.regionId} · ${data.regionName}`);
        } else if (stat === 'since') {
          $val.text(data.customerSince);
        } else if (stat === 'status') {
          $val.text(data.customerStatus);
        } else if (stat === 'classification') {
          $val.text(data.classification);
        }
      });

      // 4. Contact Information sidebar section
      if (data.contactEmail) {
        $('.contact-info-section .contact-item').each(function(i) {
          const $text = $(this).find('.contact-text');
          if (i === 0) $text.text(data.contactEmail);
          if (i === 1) $text.text(data.contactPhone || '');
        });
      }

      // 5. Relationship Manager sidebar section
      if (data.rmName) {
        $('.rm-name').text(data.rmName);
        $('.rm-role').text(data.rmRole || '');
        $('.rm-phone-number').text(data.rmPhone || '');
      }
    },

    /**
     * Renders a card's face elements and dynamic body rows.
     */
    renderCard: function(targetSelector, cardModel) {
      const $card = $(targetSelector);
      if (!$card.length) return;

      // Update Card Header (Icon, Title, Tag)
      if (cardModel.icon) {
        $card.find('.card-icon').text(cardModel.icon);
      }
      if (cardModel.title) {
        $card.find('.card-title-wrap h3').text(cardModel.title);
      }
      if (cardModel.tag) {
        const $tag = $card.find('.card-tag');
        $tag.text(cardModel.tag);
        $tag.removeClass('tag-normal tag-gold tag-cyan tag-green');
        if (cardModel.tagClass) {
          $tag.addClass(cardModel.tagClass);
        }
      }

      // Update Card Body
      const $body = $card.find('.card-body');
      $body.empty();

      if (cardModel.data && Object.keys(cardModel.data).length > 0) {
        Object.entries(cardModel.data).forEach(([key, val]) => {
          const valStr = String(val);
          const isCheck = valStr.startsWith('✔');
          const checkClass = isCheck ? 'check' : '';
          const cleanVal = isCheck ? valStr.substring(1).trim() : valStr;
          
          const rowHtml = `
            <div class="card-row">
              <span class="crow-label">${escapeHtml(key)}</span>
              <span class="crow-val ${checkClass}">${isCheck ? '✔ ' : ''}${escapeHtml(cleanVal)}</span>
            </div>
          `;
          $body.append(rowHtml);
        });
      } else {
        this.showEmptyState(targetSelector);
      }
    },

    /**
     * Shows a glassmorphic loading spinner inside the target container.
     */
    showLoader: function(targetSelector) {
      const $container = $(targetSelector);
      if (!$container.length) return;

      // Ensure target is relative positioned for absolute overlays
      if ($container.css('position') === 'static') {
        $container.css('position', 'relative');
      }

      // Remove any existing error or empty overlays
      $container.find('.card-error-overlay, .card-empty-overlay').remove();

      let $loader = $container.find('.card-loader-overlay');
      if (!$loader.length) {
        $loader = $(`
          <div class="card-loader-overlay">
            <div class="card-spinner"></div>
            <div class="card-loader-text">Loading...</div>
          </div>
        `);
        $container.append($loader);
      }

      // Force reflow
      $loader[0].offsetHeight;
      $loader.addClass('active');
    },

    /**
     * Hides the loading spinner.
     */
    hideLoader: function(targetSelector) {
      const $container = $(targetSelector);
      if (!$container.length) return;

      const $loader = $container.find('.card-loader-overlay');
      if ($loader.length) {
        $loader.removeClass('active');
        setTimeout(() => {
          if (!$loader.hasClass('active')) {
            $loader.remove();
          }
        }, 300);
      }
    },

    /**
     * Shows an error overlay with retry button.
     */
    showError: function(targetSelector, message, onRetry) {
      const $container = $(targetSelector);
      if (!$container.length) return;

      this.hideLoader(targetSelector);
      $container.find('.card-error-overlay, .card-empty-overlay').remove();

      if ($container.css('position') === 'static') {
        $container.css('position', 'relative');
      }

      const $error = $(`
        <div class="card-error-overlay">
          <div class="card-error-icon">⚠️</div>
          <div class="card-error-msg">${escapeHtml(message)}</div>
          <button class="card-retry-btn">Retry</button>
        </div>
      `);

      if (onRetry) {
        $error.find('.card-retry-btn').on('click', function(e) {
          e.stopPropagation(); // Stop click from launching modal
          $error.removeClass('active');
          setTimeout(() => $error.remove(), 300);
          onRetry();
        });
      } else {
        $error.find('.card-retry-btn').remove();
      }

      $container.append($error);
      
      // Force reflow
      $error[0].offsetHeight;
      $error.addClass('active');
    },

    /**
     * Shows an empty state overlay.
     */
    showEmptyState: function(targetSelector) {
      const $container = $(targetSelector);
      if (!$container.length) return;

      this.hideLoader(targetSelector);
      $container.find('.card-error-overlay, .card-empty-overlay').remove();

      if ($container.css('position') === 'static') {
        $container.css('position', 'relative');
      }

      const $empty = $(`
        <div class="card-empty-overlay">
          <div class="card-empty-icon">📭</div>
          <div class="card-empty-msg">No data available</div>
        </div>
      `);

      $container.append($empty);
      
      // Force reflow
      $empty[0].offsetHeight;
      $empty.addClass('active');
    }
  };

  window.UIRenderer = UIRenderer;
})();
