namespace NovelDownloader_v2.RendererRelated
{
    partial class TestRendererControlsForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.btnBack = new System.Windows.Forms.Button();
            this.btnForward = new System.Windows.Forms.Button();
            this.btnGo = new System.Windows.Forms.Button();
            this.btnStop = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.statusStrip1 = new System.Windows.Forms.StatusStrip();
            this.toolStripStatusLabel1 = new System.Windows.Forms.ToolStripStatusLabel();
            this.lblStatus = new System.Windows.Forms.ToolStripStatusLabel();
            this.flowLayoutPanel2 = new System.Windows.Forms.FlowLayoutPanel();
            this.flowLayoutPanel3 = new System.Windows.Forms.FlowLayoutPanel();
            this.txtUrl = new System.Windows.Forms.TextBox();
            this.flowLayoutPanel4 = new System.Windows.Forms.FlowLayoutPanel();
            this.flowLayoutPanel1 = new System.Windows.Forms.FlowLayoutPanel();
            this.btnExecTOCScript = new System.Windows.Forms.Button();
            this.btnExecSPURLScript = new System.Windows.Forms.Button();
            this.btnExecChapterScript = new System.Windows.Forms.Button();
            this.flowLayoutPanel5 = new System.Windows.Forms.FlowLayoutPanel();
            this.btnClearCookies = new System.Windows.Forms.Button();
            this.btnClearLocalStorage = new System.Windows.Forms.Button();
            this.flowLayoutPanel6 = new System.Windows.Forms.FlowLayoutPanel();
            this.label2 = new System.Windows.Forms.Label();
            this.lblPageType = new System.Windows.Forms.Label();
            this.statusStrip1.SuspendLayout();
            this.flowLayoutPanel2.SuspendLayout();
            this.flowLayoutPanel3.SuspendLayout();
            this.flowLayoutPanel4.SuspendLayout();
            this.flowLayoutPanel1.SuspendLayout();
            this.flowLayoutPanel5.SuspendLayout();
            this.flowLayoutPanel6.SuspendLayout();
            this.SuspendLayout();
            // 
            // btnBack
            // 
            this.btnBack.AutoSize = true;
            this.btnBack.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnBack.Enabled = false;
            this.btnBack.Location = new System.Drawing.Point(3, 3);
            this.btnBack.Name = "btnBack";
            this.btnBack.Size = new System.Drawing.Size(48, 26);
            this.btnBack.TabIndex = 0;
            this.btnBack.Text = "Back";
            this.btnBack.UseVisualStyleBackColor = true;
            this.btnBack.Click += new System.EventHandler(this.btnBack_Click);
            // 
            // btnForward
            // 
            this.btnForward.AutoSize = true;
            this.btnForward.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnForward.Enabled = false;
            this.btnForward.Location = new System.Drawing.Point(57, 3);
            this.btnForward.Name = "btnForward";
            this.btnForward.Size = new System.Drawing.Size(66, 26);
            this.btnForward.TabIndex = 1;
            this.btnForward.Text = "Forward";
            this.btnForward.UseVisualStyleBackColor = true;
            this.btnForward.Click += new System.EventHandler(this.btnForward_Click);
            // 
            // btnGo
            // 
            this.btnGo.AutoSize = true;
            this.btnGo.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnGo.Location = new System.Drawing.Point(129, 3);
            this.btnGo.Name = "btnGo";
            this.btnGo.Size = new System.Drawing.Size(35, 26);
            this.btnGo.TabIndex = 2;
            this.btnGo.Text = "Go";
            this.btnGo.UseVisualStyleBackColor = true;
            this.btnGo.Click += new System.EventHandler(this.btnGo_Click);
            // 
            // btnStop
            // 
            this.btnStop.AutoSize = true;
            this.btnStop.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnStop.Enabled = false;
            this.btnStop.Location = new System.Drawing.Point(170, 3);
            this.btnStop.Name = "btnStop";
            this.btnStop.Size = new System.Drawing.Size(45, 26);
            this.btnStop.TabIndex = 3;
            this.btnStop.Text = "Stop";
            this.btnStop.UseVisualStyleBackColor = true;
            this.btnStop.Click += new System.EventHandler(this.btnStop_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.label1.Location = new System.Drawing.Point(3, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(40, 28);
            this.label1.TabIndex = 0;
            this.label1.Text = "URL :";
            this.label1.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            // 
            // statusStrip1
            // 
            this.statusStrip1.ImageScalingSize = new System.Drawing.Size(20, 20);
            this.statusStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.toolStripStatusLabel1,
            this.lblStatus});
            this.statusStrip1.Location = new System.Drawing.Point(0, 216);
            this.statusStrip1.Name = "statusStrip1";
            this.statusStrip1.Size = new System.Drawing.Size(544, 26);
            this.statusStrip1.SizingGrip = false;
            this.statusStrip1.TabIndex = 1;
            this.statusStrip1.Text = "statusStrip1";
            // 
            // toolStripStatusLabel1
            // 
            this.toolStripStatusLabel1.Name = "toolStripStatusLabel1";
            this.toolStripStatusLabel1.Size = new System.Drawing.Size(56, 20);
            this.toolStripStatusLabel1.Text = "Status :";
            // 
            // lblStatus
            // 
            this.lblStatus.Name = "lblStatus";
            this.lblStatus.Overflow = System.Windows.Forms.ToolStripItemOverflow.Never;
            this.lblStatus.Size = new System.Drawing.Size(473, 20);
            this.lblStatus.Spring = true;
            this.lblStatus.Text = "NA";
            this.lblStatus.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // flowLayoutPanel2
            // 
            this.flowLayoutPanel2.Controls.Add(this.flowLayoutPanel3);
            this.flowLayoutPanel2.Controls.Add(this.flowLayoutPanel4);
            this.flowLayoutPanel2.Controls.Add(this.flowLayoutPanel1);
            this.flowLayoutPanel2.Controls.Add(this.flowLayoutPanel6);
            this.flowLayoutPanel2.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel2.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.flowLayoutPanel2.Location = new System.Drawing.Point(0, 0);
            this.flowLayoutPanel2.Name = "flowLayoutPanel2";
            this.flowLayoutPanel2.Size = new System.Drawing.Size(544, 216);
            this.flowLayoutPanel2.TabIndex = 2;
            this.flowLayoutPanel2.WrapContents = false;
            // 
            // flowLayoutPanel3
            // 
            this.flowLayoutPanel3.AutoSize = true;
            this.flowLayoutPanel3.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.flowLayoutPanel3.Controls.Add(this.label1);
            this.flowLayoutPanel3.Controls.Add(this.txtUrl);
            this.flowLayoutPanel3.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel3.Location = new System.Drawing.Point(3, 3);
            this.flowLayoutPanel3.Name = "flowLayoutPanel3";
            this.flowLayoutPanel3.Size = new System.Drawing.Size(528, 28);
            this.flowLayoutPanel3.TabIndex = 0;
            this.flowLayoutPanel3.WrapContents = false;
            // 
            // txtUrl
            // 
            this.txtUrl.Location = new System.Drawing.Point(49, 3);
            this.txtUrl.Name = "txtUrl";
            this.txtUrl.Size = new System.Drawing.Size(476, 22);
            this.txtUrl.TabIndex = 1;
            // 
            // flowLayoutPanel4
            // 
            this.flowLayoutPanel4.AutoSize = true;
            this.flowLayoutPanel4.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.flowLayoutPanel4.Controls.Add(this.btnBack);
            this.flowLayoutPanel4.Controls.Add(this.btnForward);
            this.flowLayoutPanel4.Controls.Add(this.btnGo);
            this.flowLayoutPanel4.Controls.Add(this.btnStop);
            this.flowLayoutPanel4.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel4.Location = new System.Drawing.Point(3, 37);
            this.flowLayoutPanel4.Name = "flowLayoutPanel4";
            this.flowLayoutPanel4.Size = new System.Drawing.Size(528, 32);
            this.flowLayoutPanel4.TabIndex = 1;
            this.flowLayoutPanel4.WrapContents = false;
            // 
            // flowLayoutPanel1
            // 
            this.flowLayoutPanel1.AutoSize = true;
            this.flowLayoutPanel1.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.flowLayoutPanel1.Controls.Add(this.btnExecTOCScript);
            this.flowLayoutPanel1.Controls.Add(this.btnExecSPURLScript);
            this.flowLayoutPanel1.Controls.Add(this.btnExecChapterScript);
            this.flowLayoutPanel1.Controls.Add(this.flowLayoutPanel5);
            this.flowLayoutPanel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel1.Location = new System.Drawing.Point(3, 75);
            this.flowLayoutPanel1.Name = "flowLayoutPanel1";
            this.flowLayoutPanel1.Size = new System.Drawing.Size(528, 70);
            this.flowLayoutPanel1.TabIndex = 5;
            // 
            // btnExecTOCScript
            // 
            this.btnExecTOCScript.AutoSize = true;
            this.btnExecTOCScript.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnExecTOCScript.Enabled = false;
            this.btnExecTOCScript.Location = new System.Drawing.Point(3, 3);
            this.btnExecTOCScript.Name = "btnExecTOCScript";
            this.btnExecTOCScript.Size = new System.Drawing.Size(133, 26);
            this.btnExecTOCScript.TabIndex = 2;
            this.btnExecTOCScript.Text = "Execute TOC Script";
            this.btnExecTOCScript.UseVisualStyleBackColor = true;
            this.btnExecTOCScript.Click += new System.EventHandler(this.btnExecTOCScript_Click);
            // 
            // btnExecSPURLScript
            // 
            this.btnExecSPURLScript.AutoSize = true;
            this.btnExecSPURLScript.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnExecSPURLScript.Enabled = false;
            this.btnExecSPURLScript.Location = new System.Drawing.Point(142, 3);
            this.btnExecSPURLScript.Name = "btnExecSPURLScript";
            this.btnExecSPURLScript.Size = new System.Drawing.Size(154, 26);
            this.btnExecSPURLScript.TabIndex = 3;
            this.btnExecSPURLScript.Text = "Execute SP-URL Script";
            this.btnExecSPURLScript.UseVisualStyleBackColor = true;
            this.btnExecSPURLScript.Click += new System.EventHandler(this.btnExecSPURLScript_Click);
            // 
            // btnExecChapterScript
            // 
            this.btnExecChapterScript.AutoSize = true;
            this.btnExecChapterScript.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnExecChapterScript.Enabled = false;
            this.btnExecChapterScript.Location = new System.Drawing.Point(302, 3);
            this.btnExecChapterScript.Name = "btnExecChapterScript";
            this.btnExecChapterScript.Size = new System.Drawing.Size(152, 26);
            this.btnExecChapterScript.TabIndex = 4;
            this.btnExecChapterScript.Text = "Execute Chapter Script";
            this.btnExecChapterScript.UseVisualStyleBackColor = true;
            this.btnExecChapterScript.Click += new System.EventHandler(this.btnExecChapterScript_Click);
            // 
            // flowLayoutPanel5
            // 
            this.flowLayoutPanel5.AutoSize = true;
            this.flowLayoutPanel5.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.flowLayoutPanel5.Controls.Add(this.btnClearCookies);
            this.flowLayoutPanel5.Controls.Add(this.btnClearLocalStorage);
            this.flowLayoutPanel5.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowLayoutPanel5.Location = new System.Drawing.Point(3, 35);
            this.flowLayoutPanel5.Name = "flowLayoutPanel5";
            this.flowLayoutPanel5.Size = new System.Drawing.Size(247, 32);
            this.flowLayoutPanel5.TabIndex = 6;
            // 
            // btnClearCookies
            // 
            this.btnClearCookies.AutoSize = true;
            this.btnClearCookies.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnClearCookies.Location = new System.Drawing.Point(3, 3);
            this.btnClearCookies.Name = "btnClearCookies";
            this.btnClearCookies.Size = new System.Drawing.Size(102, 26);
            this.btnClearCookies.TabIndex = 2;
            this.btnClearCookies.Text = "Clear Cookies";
            this.btnClearCookies.UseVisualStyleBackColor = true;
            this.btnClearCookies.Click += new System.EventHandler(this.btnClearCookies_Click);
            // 
            // btnClearLocalStorage
            // 
            this.btnClearLocalStorage.AutoSize = true;
            this.btnClearLocalStorage.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.btnClearLocalStorage.Location = new System.Drawing.Point(111, 3);
            this.btnClearLocalStorage.Name = "btnClearLocalStorage";
            this.btnClearLocalStorage.Size = new System.Drawing.Size(133, 26);
            this.btnClearLocalStorage.TabIndex = 3;
            this.btnClearLocalStorage.Text = "Clear LocalStorage";
            this.btnClearLocalStorage.UseVisualStyleBackColor = true;
            this.btnClearLocalStorage.Click += new System.EventHandler(this.btnClearLocalStorage_Click);
            // 
            // flowLayoutPanel6
            // 
            this.flowLayoutPanel6.AutoSize = true;
            this.flowLayoutPanel6.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.flowLayoutPanel6.Controls.Add(this.label2);
            this.flowLayoutPanel6.Controls.Add(this.lblPageType);
            this.flowLayoutPanel6.Location = new System.Drawing.Point(3, 151);
            this.flowLayoutPanel6.Name = "flowLayoutPanel6";
            this.flowLayoutPanel6.Size = new System.Drawing.Size(172, 16);
            this.flowLayoutPanel6.TabIndex = 6;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(3, 0);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(82, 16);
            this.label2.TabIndex = 0;
            this.label2.Text = "Page Type -";
            // 
            // lblPageType
            // 
            this.lblPageType.AutoSize = true;
            this.lblPageType.Location = new System.Drawing.Point(91, 0);
            this.lblPageType.Name = "lblPageType";
            this.lblPageType.Size = new System.Drawing.Size(78, 16);
            this.lblPageType.TabIndex = 1;
            this.lblPageType.Text = "UNKNOWN";
            // 
            // TestRendererControlsForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(544, 242);
            this.Controls.Add(this.flowLayoutPanel2);
            this.Controls.Add(this.statusStrip1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "TestRendererControlsForm";
            this.Text = "Test Renderer Controls";
            this.TopMost = true;
            this.statusStrip1.ResumeLayout(false);
            this.statusStrip1.PerformLayout();
            this.flowLayoutPanel2.ResumeLayout(false);
            this.flowLayoutPanel2.PerformLayout();
            this.flowLayoutPanel3.ResumeLayout(false);
            this.flowLayoutPanel3.PerformLayout();
            this.flowLayoutPanel4.ResumeLayout(false);
            this.flowLayoutPanel4.PerformLayout();
            this.flowLayoutPanel1.ResumeLayout(false);
            this.flowLayoutPanel1.PerformLayout();
            this.flowLayoutPanel5.ResumeLayout(false);
            this.flowLayoutPanel5.PerformLayout();
            this.flowLayoutPanel6.ResumeLayout(false);
            this.flowLayoutPanel6.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button btnBack;
        private System.Windows.Forms.Button btnForward;
        private System.Windows.Forms.StatusStrip statusStrip1;
        private System.Windows.Forms.ToolStripStatusLabel toolStripStatusLabel1;
        private System.Windows.Forms.ToolStripStatusLabel lblStatus;
        private System.Windows.Forms.Button btnGo;
        private System.Windows.Forms.Button btnStop;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel2;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel3;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel4;
        private System.Windows.Forms.TextBox txtUrl;
        private System.Windows.Forms.Button btnExecTOCScript;
        private System.Windows.Forms.Button btnExecSPURLScript;
        private System.Windows.Forms.Button btnExecChapterScript;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel1;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel5;
        private System.Windows.Forms.Button btnClearCookies;
        private System.Windows.Forms.Button btnClearLocalStorage;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel6;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label lblPageType;
    }
}