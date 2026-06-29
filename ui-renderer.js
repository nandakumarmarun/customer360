/**
 * Data Integration Layer - UI Renderer
 * Generates markup and sets loading/error states.
 */
(function () {
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

  // Parse alert emoji and message helper
  function parseAlert(alertStr) {
    if (!alertStr) return { icon: "🔔", message: "" };
    // Regex to extract emoji or symbol at the beginning
    const match = alertStr.match(/^([^\w\s\d,.:;?!"'\(\)\[\]\{\}\-–—#$€£¥₹\+\*]+)\s*(.*)$/u);
    if (match) {
      return {
        icon: match[1].trim(),
        message: match[2].trim()
      };
    }
    return {
      icon: "🔔",
      message: alertStr
    };
  }

  const UIRenderer = {
    /**
     * Renders the common customer summary details across the sidebar, header, and avatar panel.
     */
    renderSummary: function (data) {
      if (!data) return;

      function updateAvatar($el, imageUrl, initials) {
        $el.empty();
        if ($el.css('position') === 'static') {
          $el.css('position', 'relative');
        }
        $el.css('overflow', 'hidden');

        // 1. Always render the initials as the reliable base layer
        if ($el.hasClass('avatar-inner')) {
          $el.append($('<div class="avatar-face"></div>').text(initials));
        } else {
          $el.text(initials);
        }

        // 2. If an image URL or resource is provided, format it and layer it on top
        let finalSrc = null;
        if (imageUrl) {
          if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            let trimmed = imageUrl.trim();
            // If the string doesn't look like a URL or an existing data URI, assume it's raw base64 bytes
            if (!trimmed.startsWith('http') && !trimmed.startsWith('data:') && !trimmed.startsWith('/') && !trimmed.startsWith('.')) {
              finalSrc = 'data:image/png;base64,' + trimmed;
            } else {
              finalSrc = trimmed;
            }
          } else if (imageUrl instanceof Blob || imageUrl instanceof File) {
            // Handle raw binary resources
            finalSrc = URL.createObjectURL(imageUrl);
          }
        }

        if (finalSrc) {
          const $img = $('<img>').attr('src', finalSrc).css({
            width: '100%',
            height: '100%',
            'object-fit': 'cover',
            'border-radius': '50%',
            position: 'absolute',
            top: 0,
            left: 0,
            'z-index': 10
          }).on('error', function () {
            // If the image fails to load or is an invalid type, just remove it 
            // and the base layer initials will instantly be visible.
            $(this).remove();
          });
          $el.append($img);
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

      $('.header-stat').each(function () {
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
      const tierVal = (data.tier || '').toLowerCase().trim();
      const $tierBadge = $('#cb-tier-badge');
      const $sidebarCrown = $('#sidebar-crown');
      const $avatarCrown = $('#avatar-crown');

      if (tierVal === 'prime platinum') {
        $tierBadge.html('👑 PRIME PLATINUM').show();
        $sidebarCrown.show();
        $avatarCrown.show();
      } else if (tierVal === 'prime') {
        $tierBadge.html('★ PRIME').show();
        $sidebarCrown.hide();
        $avatarCrown.show();
      } else {
        $tierBadge.hide();
        $sidebarCrown.hide();
        $avatarCrown.hide();
      }

      // Trade Finance badge — shown only when tradeFinanceEnabled is true
      const $tradeBadge = $('#cb-trade-badge');
      data.tradeFinanceEnabled ? $tradeBadge.show() : $tradeBadge.hide();

      // Rating badge
      $('.profile-tier .rating-badge').text(`★ ${data.rating || 'A+'}`);

      // Dynamic Profile Meta Badges
      $('.profile-tier .meta-badge-status').html(`<strong>${data.gender || '-'}</strong>`);
      $('.profile-tier .meta-badge-class').html(`<strong>${data.classification || '-'}</strong>`);
      if (data.staff || data.isStaff) {
        $('.profile-tier .meta-badge-staff').show().html(`<strong>Staff</strong>`);
      } else {
        $('.profile-tier .meta-badge-staff').hide();
      }

      $('.pstat-row').each(function () {
        const stat = $(this).attr('data-stat');
        const $val = $(this).find('.pstat-row-val');
        if (stat === 'gender') {
          const genderVal = data.gender || '';
          const genderIcon = genderVal.toLowerCase() === 'male' ? '♂️' : (genderVal.toLowerCase() === 'female' ? '♀️' : genderVal);
          const colorClass = genderVal.toLowerCase() === 'male' ? 'male-color' : (genderVal.toLowerCase() === 'female' ? 'female-color' : '');
          $val.html(`<span class="gender-icon ${colorClass}">${genderIcon}</span> ${genderVal}`);
        } else if (stat === 'branch') {
          const valText = `${data.branchId} · ${data.branchName}`;
          $val.text(valText);
          $(this).attr('data-tooltip', `Branch: ${valText}`);
        } else if (stat === 'region') {
          const valText = `${data.regionId} · ${data.regionName}`;
          $val.text(valText);
          $(this).attr('data-tooltip', `Region: ${valText}`);
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
        $('.contact-info-section .contact-item').each(function (i) {
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

      // 6. Live Alerts Ticker
      if (data.alerts && Array.isArray(data.alerts) && data.alerts.length > 0) {
        const $tickerContent = $('.ticker-content');
        $tickerContent.empty();
        data.alerts.forEach(alert => {
          $tickerContent.append(`<span>${escapeHtml(alert)}</span>`);
        });

        // Ensure animation triggers smoothly by resetting the animation
        $tickerContent.css('animation', 'none');
        $tickerContent[0].offsetHeight; // trigger reflow
        $tickerContent.css('animation', '');
      }

      // 7. Dynamic Notifications Panel
      const $notifList = $('#notif-list');
      const $notifCount = $('#notif-count-badge');
      const $notifDot = $('.notif-dot');
      
      if ($notifList.length) {
        $notifList.empty();
        const alerts = data.alerts || [];
        $notifCount.text(alerts.length);
        
        if (alerts.length > 0) {
          $notifDot.show();
          alerts.forEach(alertText => {
            const parsed = parseAlert(alertText);
            const cardHtml = `
              <div class="notif-card">
                <div class="notif-card-icon">${parsed.icon}</div>
                <div class="notif-card-content">
                  <div class="notif-card-header">
                    <span class="notif-card-title">Alert</span>
                    <span class="notif-card-time">now</span>
                  </div>
                  <div class="notif-card-msg">${escapeHtml(parsed.message)}</div>
                </div>
              </div>
            `;
            $notifList.append(cardHtml);
          });
        } else {
          $notifDot.hide();
          $notifList.html('<div class="notif-empty-state">No Alerts Available</div>');
        }
      }

      // Remove skeleton classes from all summary elements
      $('.skeleton-box').removeClass('skeleton-box');
    },

    /**
     * Renders a card's face elements and dynamic body rows.
     */
    renderCard: function (targetSelector, cardModel) {
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

      // Remove skeleton classes from the header
      $card.find('.skeleton-box').removeClass('skeleton-box');

      // Update Card Body
      const $body = $card.find('.card-body');
      $body.empty();

      if (cardModel.data && Object.keys(cardModel.data).length > 0) {
        Object.entries(cardModel.data).forEach(([key, val]) => {
          const valStr = String(val);
          const isCheck = valStr.startsWith('✔');
          const checkClass = isCheck ? 'check' : '';
          const cleanVal = isCheck ? valStr.substring(1).trim() : valStr;
          
          // Apply scroll logic for long text on small cards
          const isScrollable = cleanVal.length > 80;
          const scrollStyle = isScrollable ? 'max-height: 60px; overflow-y: auto; padding-right: 4px; display: block; white-space: pre-wrap; word-break: break-word;' : '';
          const scrollClass = isScrollable ? 'scrollable-field' : '';

          const rowHtml = `
            <div class="card-row">
              <span class="crow-label">${escapeHtml(key)}</span>
              <span class="crow-val ${checkClass} ${scrollClass}" style="${scrollStyle}">${isCheck ? '✔ ' : ''}${escapeHtml(cleanVal)}</span>
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
    showLoader: function (targetSelector) {
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
    hideLoader: function (targetSelector) {
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
    showError: function (targetSelector, message, onRetry) {
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
        $error.find('.card-retry-btn').on('click', function (e) {
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
    showEmptyState: function (targetSelector) {
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
    },

    /**
     * Shows a beautiful fullscreen alert modal when no Customer ID is present.
     */
    showNoDataAlert: function () {
      let $overlay = $('#no-data-modal-overlay');
      if (!$overlay.length) {
        // Inject custom styles if not already present
        if (!$('#no-data-styles').length) {
          const styles = `
            @keyframes pulseGlow {
              0% { transform: scale(1); box-shadow: 0 0 20px var(--glow-shadow-weak); }
              50% { transform: scale(1.05); box-shadow: 0 0 35px var(--glow-shadow-medium); }
              100% { transform: scale(1); box-shadow: 0 0 20px var(--glow-shadow-weak); }
            }
          `;
          $('<style id="no-data-styles">').text(styles).appendTo('head');
        }

        const overlayHtml = `
          <div id="no-data-modal-overlay" style="position: fixed; inset: 0; background: rgba(18, 20, 28, 0.88); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 99999; opacity: 0; pointer-events: none; transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);">
            <div id="no-data-modal-card" style="width: 90%; max-width: 440px; background: var(--bg2); border: 1px solid var(--border); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px var(--glow-shadow-weak); border-radius: var(--radius); padding: 40px 30px; text-align: center; transform: scale(0.8) translateY(-40px); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;">
              <div style="position: absolute; width: 150px; height: 150px; background: var(--accent); filter: blur(70px); top: -50px; left: calc(50% - 75px); border-radius: 50%; opacity: 0.35; z-index: 0; pointer-events: none;"></div>
              
              <div style="position: relative; z-index: 1;">
                <div id="no-data-icon-wrap" style="width: 80px; height: 80px; margin: 0 auto 24px; background: rgba(170, 0, 0, 0.1); border: 2px solid var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 38px; box-shadow: 0 0 20px var(--glow-shadow-medium); animation: pulseGlow 2s infinite ease-in-out;">
                  📭
                </div>
                
                <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 12px; color: var(--text); font-family: 'Outfit', sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
                  No Data Present
                </h2>
                
                <p style="font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 0; padding: 0 10px; font-family: 'Outfit', sans-serif;">
                  An active customer ID was not specified. Please pass a valid customer identifier in the URL (e.g. <code>?customerId=NX-4829-0055</code>) to view profile details.
                </p>
              </div>
            </div>
          </div>
        `;
        $('body').append(overlayHtml);
        $overlay = $('#no-data-modal-overlay');
      }

      // Show overlay with animation
      setTimeout(() => {
        $overlay.css({
          'opacity': '1',
          'pointer-events': 'auto'
        });
        $('#no-data-modal-card').css('transform', 'scale(1) translateY(0)');
        document.body.style.overflow = 'hidden';
      }, 100);
    }
  };

  window.UIRenderer = UIRenderer;
})();
